import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

/**
 * Role hierarchy and permissions
 */
export const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  user: 2, // default role for new accounts
  viewer: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can perform action based on role
 */
export function canPerformAction(
  userRole: UserRole,
  action: string
): boolean {
  const permissions: Record<UserRole, string[]> = {
    admin: [
      // Full access
      "team:manage",
      "team:invite",
      "team:remove_members",
      "campaign:create",
      "campaign:edit",
      "campaign:delete",
      "campaign:send",
      "lead:create",
      "lead:edit",
      "lead:delete",
      "template:create",
      "template:edit",
      "template:delete",
      "settings:edit",
    ],
    manager: [
      // Campaign and lead management
      "campaign:create",
      "campaign:edit",
      "campaign:send",
      "lead:create",
      "lead:edit",
      "template:create",
      "template:edit",
    ],
    user: [
      // Default role: manage own campaigns, leads and templates
      "campaign:create",
      "campaign:edit",
      "campaign:send",
      "lead:create",
      "lead:edit",
      "template:create",
      "template:edit",
    ],
    viewer: [
      // Read-only access
      "campaign:view",
      "lead:view",
      "template:view",
      "dashboard:view",
    ],
  };

  return permissions[userRole]?.includes(action) || false;
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(requiredRole: UserRole) {
  return (ctx: TrpcContext) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    const userRole = ctx.user.role as UserRole;
    if (!hasRole(userRole, requiredRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires ${requiredRole} role or higher`,
      });
    }

    return ctx;
  };
}

/**
 * Middleware to check if user can perform specific action
 */
export function requirePermission(action: string) {
  return (ctx: TrpcContext) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    const userRole = ctx.user.role as UserRole;
    if (!canPerformAction(userRole, action)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You don't have permission to ${action}`,
      });
    }

    return ctx;
  };
}

/**
 * Check if user is team owner
 */
export async function isTeamOwner(
  userId: number,
  teamId: number
): Promise<boolean> {
  const { getDb } = await import("./db");
  const { teams } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return false;

  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return team[0]?.ownerId === userId;
}

/**
 * Check if user belongs to team
 */
export async function isTeamMember(
  userId: number,
  teamId: number
): Promise<boolean> {
  const { getDb } = await import("./db");
  const { users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return false;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0]?.teamId === teamId;
}
