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
   * Login with email and password (with optional 2FA)
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, twoFactorCode } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await authService.login(email, password);

      // Check if 2FA is enabled for this user
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // If no 2FA code provided, return that 2FA is required
        if (!twoFactorCode) {
          return res.json({
            success: false,
            requiresTwoFactor: true,
            message: "Two-factor authentication required",
          });
        }

        // Verify 2FA code
        const { verifyToken, verifyBackupCode, decryptSecret } = await import("../services/twoFactorAuth");
        const encryptionKey = ENV.appSecret || "default-key";
        const decryptedSecret = decryptSecret(user.twoFactorSecret, encryptionKey);
        
        let isValid = verifyToken(decryptedSecret, twoFactorCode);
        
        // If token is invalid, check if it's a backup code
        if (!isValid && user.twoFactorBackupCodes) {
          const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
          const backupResult = verifyBackupCode(twoFactorCode, backupCodes);
          if (backupResult.valid) {
            isValid = true;
            // Remove used backup code
            backupCodes.splice(backupResult.index, 1);
            const { updateUserTwoFactor } = await import("../db");
            await updateUserTwoFactor(user.openId, {
              twoFactorBackupCodes: JSON.stringify(backupCodes),
            });
          }
        }

        if (!isValid) {
          logSecurityEvent({
            type: SecurityEventType.LOGIN_FAILURE,
            email: user.email || undefined,
            userId: user.id,
            ...getClientInfo(req),
            details: { reason: "Invalid 2FA code" },
          });
          return res.status(401).json({ error: "Invalid two-factor authentication code" });
        }
      }

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
        details: { twoFactorUsed: user.twoFactorEnabled },
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
      //     } catch (error) {
      console.error("[Auth] Login failed:", error);
      logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        email: req.body.email,
        ...getClientInfo(req),
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      });
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({ error: message });
    }
  });

  /**
   * POST /api/auth/login/2fa
   * Complete login with 2FA code (separate step)
   */
  app.post("/api/auth/login/2fa", async (req: Request, res: Response) => {
    try {
      const { email, password, code, isBackupCode } = req.body;

      if (!email || !password || !code) {
        return res.status(400).json({ error: "Email, password, and code are required" });
      }

      const user = await authService.login(email, password);

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ error: "2FA is not enabled for this account" });
      }

      const { verifyToken, verifyBackupCode, decryptSecret } = await import("../services/twoFactorAuth");
      const encryptionKey = ENV.appSecret || "default-key";
      const decryptedSecret = decryptSecret(user.twoFactorSecret, encryptionKey);
      
      let isValid = false;

      if (isBackupCode && user.twoFactorBackupCodes) {
        // Verify backup code
        const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
        const backupResult = verifyBackupCode(code, backupCodes);
        if (backupResult.valid) {
          isValid = true;
          // Remove used backup code
          backupCodes.splice(backupResult.index, 1);
          const { updateUserTwoFactor } = await import("../db");
          await updateUserTwoFactor(user.openId, {
            twoFactorBackupCodes: JSON.stringify(backupCodes),
          });
        }
      } else {
        // Verify TOTP code
        isValid = verifyToken(decryptedSecret, code);
      }

      if (!isValid) {
        logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILURE,
          email: user.email || undefined,
          userId: user.id,
          ...getClientInfo(req),
          details: { reason: "Invalid 2FA code", isBackupCode },
        });
        return res.status(401).json({ error: "Ugyldig kode. Prøv igjen." });
      }

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
        details: { twoFactorUsed: true, usedBackupCode: isBackupCode },
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
      console.error("[Auth] 2FA login failed:", error);
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

  /**
   * POST /api/auth/2fa/setup
   * Initialize 2FA setup - generate secret and QR code
   */
  app.post("/api/auth/2fa/setup", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      
      if (user.twoFactorEnabled) {
        return res.status(400).json({ error: "Two-factor authentication is already enabled" });
      }

      const { generateSecret, generateQRCode, encryptSecret } = await import("../services/twoFactorAuth");
      
      const { secret, otpAuthUrl } = generateSecret(user.email || user.openId);
      const qrCode = await generateQRCode(otpAuthUrl);
      
      // Store encrypted secret temporarily (not enabled yet)
      const encryptionKey = ENV.appSecret || "default-key";
      const encryptedSecret = encryptSecret(secret, encryptionKey);
      
      const { updateUserTwoFactor } = await import("../db");
      await updateUserTwoFactor(user.openId, {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: false,
      });

      res.json({
        success: true,
        secret, // Show secret for manual entry
        qrCode, // QR code data URL
      });
    } catch (error) {
      console.error("[Auth] 2FA setup failed:", error);
      res.status(400).json({ error: "Failed to setup two-factor authentication" });
    }
  });

  /**
   * POST /api/auth/2fa/verify
   * Verify 2FA code and enable 2FA
   */
  app.post("/api/auth/2fa/verify", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Verification code is required" });
      }

      if (!user.twoFactorSecret) {
        return res.status(400).json({ error: "Please setup 2FA first" });
      }

      const { verifyToken, decryptSecret, generateBackupCodes, hashBackupCode } = await import("../services/twoFactorAuth");
      const encryptionKey = ENV.appSecret || "default-key";
      const decryptedSecret = decryptSecret(user.twoFactorSecret, encryptionKey);

      const isValid = verifyToken(decryptedSecret, code);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(hashBackupCode);

      // Enable 2FA
      const { updateUserTwoFactor } = await import("../db");
      await updateUserTwoFactor(user.openId, {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      });

      logSecurityEvent({
        type: SecurityEventType.TWO_FACTOR_ENABLED,
        userId: user.id,
        email: user.email || undefined,
        ...getClientInfo(req),
      });

      res.json({
        success: true,
        backupCodes, // Return plain backup codes (only shown once)
        message: "Two-factor authentication enabled successfully",
      });
    } catch (error) {
      console.error("[Auth] 2FA verify failed:", error);
      res.status(400).json({ error: "Failed to verify two-factor authentication" });
    }
  });

  /**
   * POST /api/auth/2fa/disable
   * Disable 2FA (requires password confirmation)
   */
  app.post("/api/auth/2fa/disable", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      const { password, code } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required to disable 2FA" });
      }

      // Verify password
      const { getUserPassword } = await import("../db");
      const passwordHash = await getUserPassword(user.openId);
      if (passwordHash) {
        const isValid = await authService.verifyPassword(password, passwordHash);
        if (!isValid) {
          return res.status(400).json({ error: "Incorrect password" });
        }
      }

      // Verify 2FA code if enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!code) {
          return res.status(400).json({ error: "2FA code is required" });
        }
        
        const { verifyToken, decryptSecret } = await import("../services/twoFactorAuth");
        const encryptionKey = ENV.appSecret || "default-key";
        const decryptedSecret = decryptSecret(user.twoFactorSecret, encryptionKey);
        
        const isValid = verifyToken(decryptedSecret, code);
        if (!isValid) {
          return res.status(400).json({ error: "Invalid 2FA code" });
        }
      }

      // Disable 2FA
      const { updateUserTwoFactor } = await import("../db");
      await updateUserTwoFactor(user.openId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      });

      logSecurityEvent({
        type: SecurityEventType.TWO_FACTOR_DISABLED,
        userId: user.id,
        email: user.email || undefined,
        ...getClientInfo(req),
      });

      res.json({
        success: true,
        message: "Two-factor authentication disabled",
      });
    } catch (error) {
      console.error("[Auth] 2FA disable failed:", error);
      res.status(400).json({ error: "Failed to disable two-factor authentication" });
    }
  });

  /**
   * GET /api/auth/2fa/status
   * Get 2FA status for current user
   */
  app.get("/api/auth/2fa/status", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      
      let backupCodesRemaining = 0;
      if (user.twoFactorBackupCodes) {
        const codes = JSON.parse(user.twoFactorBackupCodes) as string[];
        backupCodesRemaining = codes.length;
      }

      res.json({
        enabled: user.twoFactorEnabled || false,
        backupCodesRemaining,
      });
    } catch (error) {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  /**
   * POST /api/auth/2fa/regenerate-backup
   * Regenerate backup codes
   */
  app.post("/api/auth/2fa/regenerate-backup", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      const { code } = req.body;

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(400).json({ error: "2FA is not enabled" });
      }

      if (!code) {
        return res.status(400).json({ error: "2FA code is required" });
      }

      // Verify current 2FA code
      const { verifyToken, decryptSecret, generateBackupCodes, hashBackupCode } = await import("../services/twoFactorAuth");
      const encryptionKey = ENV.appSecret || "default-key";
      const decryptedSecret = decryptSecret(user.twoFactorSecret, encryptionKey);
      
      const isValid = verifyToken(decryptedSecret, code);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid 2FA code" });
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(hashBackupCode);

      const { updateUserTwoFactor } = await import("../db");
      await updateUserTwoFactor(user.openId, {
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      });

      res.json({
        success: true,
        backupCodes,
        message: "Backup codes regenerated successfully",
      });
    } catch (error) {
      console.error("[Auth] Regenerate backup codes failed:", error);
      res.status(400).json({ error: "Failed to regenerate backup codes" });
    }
  });
}
