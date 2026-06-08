import { COOKIE_NAME, REFRESH_COOKIE_NAME, ACCESS_TOKEN_EXPIRY_MS, REFRESH_TOKEN_EXPIRY_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  email?: string;
  role?: string;
  type?: "access" | "refresh";
};

class AuthService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a unique openId for new users
   */
  generateOpenId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate a secure random token
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  /**
   * Hash a refresh token for storage
   */
  hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Create an access token (short-lived)
   */
  async createAccessToken(payload: SessionPayload): Promise<string> {
    const issuedAt = Date.now();
    const expirationSeconds = Math.floor((issuedAt + ACCESS_TOKEN_EXPIRY_MS) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      type: "access",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Create a session token (legacy - for backward compatibility)
   */
  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    return this.createAccessToken(payload);
  }

  /**
   * Verify session token
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      
      const { openId, appId, name, email, role, type } = payload as Record<string, unknown>;

      if (typeof openId !== "string" || typeof appId !== "string") {
        return null;
      }

      return {
        openId,
        appId,
        name: (name as string) || "",
        email: email as string | undefined,
        role: role as string | undefined,
        type: type as "access" | "refresh" | undefined,
      };
    } catch (error) {
      // Token expired or invalid
      return null;
    }
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(
    userId: number,
    token: string,
    req: Request
  ): Promise<void> {
    const tokenHash = this.hashRefreshToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    const userAgent = req.headers["user-agent"] || null;
    const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || null;

    await db.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    });
  }

  /**
   * Verify and rotate refresh token
   */
  async verifyAndRotateRefreshToken(
    token: string,
    req: Request
  ): Promise<{ user: User; newRefreshToken: string } | { raceIgnored: true } | null> {
    const tokenHash = this.hashRefreshToken(token);
    
    // Find the token in database
    const storedToken = await db.getRefreshTokenByHash(tokenHash);
    
    if (!storedToken) {
      return null;
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await db.revokeRefreshToken(storedToken.id);
      return null;
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      // A recently-rotated token replayed within a short grace window is almost
      // always a benign concurrent refresh (e.g. two browser tabs), NOT theft.
      // Ignore it without nuking the whole token family so the user stays logged in.
      const REUSE_GRACE_MS = 60 * 1000;
      const revokedMsAgo = Date.now() - new Date(storedToken.revokedAt).getTime();
      if (revokedMsAgo <= REUSE_GRACE_MS) {
        console.warn(`[Auth] Concurrent refresh within grace window for user ${storedToken.userId} — ignoring`);
        return { raceIgnored: true } as const;
      }
      // Replayed long after rotation -> likely token theft. Revoke everything.
      await db.revokeAllUserRefreshTokens(storedToken.userId);
      console.warn(`[Security] Possible refresh token reuse detected for user ${storedToken.userId}`);
      return null;
    }

    // Get user
    const user = await db.getUserById(storedToken.userId);
    if (!user) {
      return null;
    }

    // Revoke old token
    await db.revokeRefreshToken(storedToken.id);

    // Generate new refresh token (rotation)
    const newRefreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(user.id, newRefreshToken, req);

    return { user, newRefreshToken };
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await db.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Set access token cookie
   */
  setAccessTokenCookie(res: Response, req: Request, token: string): void {
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { 
      ...cookieOptions, 
      maxAge: ACCESS_TOKEN_EXPIRY_MS 
    });
  }

  /**
   * Set refresh token cookie
   */
  setRefreshTokenCookie(res: Response, req: Request, token: string): void {
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(REFRESH_COOKIE_NAME, token, { 
      ...cookieOptions, 
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
      path: "/api/auth", // Only send to auth endpoints
    });
  }

  /**
   * Set session cookie (legacy - calls both)
   */
  setSessionCookie(res: Response, req: Request, token: string): void {
    this.setAccessTokenCookie(res, req, token);
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(res: Response, req: Request): void {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, path: "/api/auth" });
  }

  /**
   * Get refresh token from request
   */
  getRefreshTokenFromRequest(req: Request): string | null {
    const cookies = this.parseCookies(req.headers.cookie);
    return cookies.get(REFRESH_COOKIE_NAME) || null;
  }

  /**
   * Authenticate request and return user
   */
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session");
    }

    const user = await db.getUserByOpenId(session.openId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update last signed in
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<User> {
    // Normalize email to lowercase to prevent duplicate accounts
    const normalizedEmail = data.email.toLowerCase();
    
    // Check if email already exists
    const existingUser = await db.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const openId = this.generateOpenId();
    const passwordHash = await this.hashPassword(data.password);

    await db.upsertUser({
      openId,
      email: normalizedEmail, // Store email in lowercase
      name: data.name,
      loginMethod: "email",
      lastSignedIn: new Date(),
      subscriptionPlan: "free", // Start with free plan
      monthlyLeadsQuota: 50, // Free plan limit
      usedLeadsThisMonth: 0,
    });

    // Store password hash separately
    await db.setUserPassword(openId, passwordHash);

    const user = await db.getUserByOpenId(openId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<User> {
    // Normalize email to lowercase for case-insensitive login
    const normalizedEmail = email.toLowerCase();
    const user = await db.getUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordHash = await db.getUserPassword(user.openId);
    if (!passwordHash) {
      throw new Error("Invalid email or password");
    }

    const isValid = await this.verifyPassword(password, passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Update last signed in
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export const authService = new AuthService();
