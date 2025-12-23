import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
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
   * Create a session token
   */
  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
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
      
      const { openId, appId, name, email, role } = payload as Record<string, unknown>;

      if (typeof openId !== "string" || typeof appId !== "string") {
        return null;
      }

      return {
        openId,
        appId,
        name: (name as string) || "",
        email: email as string | undefined,
        role: role as string | undefined,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Set session cookie
   */
  setSessionCookie(res: Response, req: Request, token: string): void {
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(res: Response, req: Request): void {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
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
