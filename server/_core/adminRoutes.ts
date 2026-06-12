import type { Express, Request, Response } from "express";
import { authService } from "./auth";
import * as db from "../db";
import { logSecurityEvent, SecurityEventType, getClientInfo } from "./securityLogger";

/**
 * Middleware to check if user is admin
 */
async function requireAdmin(req: Request, res: Response, next: () => void) {
  try {
    const user = await authService.authenticateRequest(req);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Not authenticated" });
  }
}

export function registerAdminRoutes(app: Express) {
  /**
   * GET /api/admin/stats
   * Get admin dashboard statistics
   */
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await db.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("[Admin] Failed to get stats:", error);
      res.status(500).json({ error: "Failed to get statistics" });
    }
  });

  /**
   * GET /api/admin/users
   * Get all users
   */
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await db.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("[Admin] Failed to get users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  /**
   * PUT /api/admin/users/:id/role
   * Update user role
   */
  app.put("/api/admin/users/:id/role", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      const { role } = req.body;

      if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: "Invalid user id" });
      }

      // Prevent an admin from changing their own role (avoids accidental
      // lockout and self-escalation games with multiple admin accounts)
      if (currentUser.id === userId) {
        return res.status(400).json({ error: "Cannot change your own role" });
      }

      if (!["admin", "user", "manager", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      await db.updateUserRole(userId, role);
      logSecurityEvent({
        type: SecurityEventType.ROLE_CHANGED,
        userId: currentUser.id,
        ...getClientInfo(req),
        details: { action: "role_change", targetUserId: userId, newRole: role },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to update user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  /**
   * DELETE /api/admin/users/:id
   * Delete user
   */
  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = (req as any).user;

      // Prevent self-deletion
      if (currentUser.id === userId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await db.deleteUser(userId);
      logSecurityEvent({
        type: SecurityEventType.USER_DELETED,
        userId: currentUser.id,
        ...getClientInfo(req),
        details: { targetUserId: userId },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin] Failed to delete user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  /**
   * GET /api/admin/companies/stats
   * Get company statistics
   */
  app.get("/api/admin/companies/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await db.getCompaniesStats();
      res.json(stats);
    } catch (error) {
      console.error("[Admin] Failed to get company stats:", error);
      res.status(500).json({ error: "Failed to get company statistics" });
    }
  });

  /**
   * POST /api/admin/import-companies
   * Import companies from Brønnøysund (placeholder)
   */
  app.post("/api/admin/import-companies", requireAdmin, async (req: Request, res: Response) => {
    try {
      // This would trigger the company import process
      res.json({ 
        success: true, 
        message: "Company import started. Check logs for progress." 
      });
    } catch (error) {
      console.error("[Admin] Failed to start import:", error);
      res.status(500).json({ error: "Failed to start import" });
    }
  });
}
