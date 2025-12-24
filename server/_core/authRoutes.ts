import type { Express, Request, Response } from "express";
import { authService } from "./auth";
import { ENV } from "./env";
import { logSecurityEvent, SecurityEventType, getClientInfo } from "./securityLogger";

export function registerAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const user = await authService.register({ email, password, name });

      // Create access token
      const accessToken = await authService.createAccessToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "",
        email: user.email || undefined,
        role: user.role,
      });

      // Create and store refresh token
      const refreshToken = authService.generateRefreshToken();
      await authService.storeRefreshToken(user.id, refreshToken, req);

      // Set cookies
      authService.setAccessTokenCookie(res, req, accessToken);
      authService.setRefreshTokenCookie(res, req, refreshToken);

      // Log successful registration
      logSecurityEvent({
        type: SecurityEventType.REGISTRATION,
        userId: user.id,
        email: user.email || undefined,
        ...getClientInfo(req),
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Registration failed:", error);
      const message = error instanceof Error ? error.message : "Registration failed";
      res.status(400).json({ error: message });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await authService.login(email, password);

      // Create access token
      const accessToken = await authService.createAccessToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "",
        email: user.email || undefined,
        role: user.role,
      });

      // Create and store refresh token
      const refreshToken = authService.generateRefreshToken();
      await authService.storeRefreshToken(user.id, refreshToken, req);

      // Set cookies
      authService.setAccessTokenCookie(res, req, accessToken);
      authService.setRefreshTokenCookie(res, req, refreshToken);

      // Log successful login
      logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        userId: user.id,
        email: user.email || undefined,
        ...getClientInfo(req),
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      // Log failed login attempt
      logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        email: req.body?.email,
        ...getClientInfo(req),
        details: { reason: error instanceof Error ? error.message : "Unknown" },
      });

      console.error("[Auth] Login failed:", error);
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({ error: message });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = authService.getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
      }

      const result = await authService.verifyAndRotateRefreshToken(refreshToken, req);

      if (!result) {
        // Clear cookies on invalid refresh token
        authService.clearSessionCookie(res, req);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }

      const { user, newRefreshToken } = result;

      // Create new access token
      const accessToken = await authService.createAccessToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "",
        email: user.email || undefined,
        role: user.role,
      });

      // Set new cookies
      authService.setAccessTokenCookie(res, req, accessToken);
      authService.setRefreshTokenCookie(res, req, newRefreshToken);

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Token refresh failed:", error);
      authService.clearSessionCookie(res, req);
      res.status(401).json({ error: "Token refresh failed" });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // Try to get user to revoke their tokens
      const user = await authService.authenticateRequest(req).catch(() => null);
      
      if (user) {
        // Revoke all refresh tokens for this user
        await authService.revokeAllUserTokens(user.id);
        
        logSecurityEvent({
          type: SecurityEventType.LOGOUT,
          userId: user.id,
          email: user.email || undefined,
          ...getClientInfo(req),
        });
      }
    } catch (error) {
      // Ignore errors during logout
    }

    authService.clearSessionCookie(res, req);
    res.json({ success: true });
  });

  /**
   * POST /api/auth/logout-all
   * Logout from all devices
   */
  app.post("/api/auth/logout-all", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      
      // Revoke all refresh tokens
      await authService.revokeAllUserTokens(user.id);
      
      // Clear current session
      authService.clearSessionCookie(res, req);

      logSecurityEvent({
        type: SecurityEventType.LOGOUT,
        userId: user.id,
        email: user.email || undefined,
        ...getClientInfo(req),
        details: { allDevices: true },
      });

      res.json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  /**
   * PUT /api/auth/profile
   * Update current user profile
   */
  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      const { name } = req.body;

      if (name) {
        const { upsertUser } = await import("../db");
        await upsertUser({
          openId: user.openId,
          name,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Profile update failed:", error);
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // For now, just return success (email sending requires SendGrid setup)
      // In production, this would:
      // 1. Check if user exists
      // 2. Generate a reset token
      // 3. Send email with reset link
      
      console.log(`[Auth] Password reset requested for: ${email}`);
      
      // Always return success to prevent email enumeration
      res.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link." 
      });
    } catch (error) {
      console.error("[Auth] Forgot password failed:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  /**
   * PUT /api/auth/password
   * Change password
   */
  app.put("/api/auth/password", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const { getUserPassword, setUserPassword } = await import("../db");
      
      const currentHash = await getUserPassword(user.openId);
      if (currentHash) {
        const isValid = await authService.verifyPassword(currentPassword, currentHash);
        if (!isValid) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
      }

      const newHash = await authService.hashPassword(newPassword);
      await setUserPassword(user.openId, newHash);

      // Revoke all refresh tokens except current session (force re-login on other devices)
      await authService.revokeAllUserTokens(user.id);

      // Create new tokens for current session
      const accessToken = await authService.createAccessToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "",
        email: user.email || undefined,
        role: user.role,
      });
      const refreshToken = authService.generateRefreshToken();
      await authService.storeRefreshToken(user.id, refreshToken, req);

      authService.setAccessTokenCookie(res, req, accessToken);
      authService.setRefreshTokenCookie(res, req, refreshToken);

      logSecurityEvent({
        type: SecurityEventType.PASSWORD_CHANGE,
        userId: user.id,
        email: user.email || undefined,
        ...getClientInfo(req),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Password change failed:", error);
      res.status(400).json({ error: "Failed to change password" });
    }
  });
}
