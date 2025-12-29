import { createActivityLog, CreateActivityLogData } from "../db";

// Activity Logger Service
// Provides easy-to-use functions for logging user activities

export type ActionType = 
  | "create" 
  | "update" 
  | "delete" 
  | "view" 
  | "export" 
  | "login" 
  | "logout" 
  | "send" 
  | "sync"
  | "import";

export type EntityType = 
  | "company" 
  | "lead" 
  | "campaign" 
  | "template" 
  | "sequence"
  | "user" 
  | "settings" 
  | "calendar"
  | "email";

interface LogActivityParams {
  userId: number;
  action: ActionType;
  entityType: EntityType;
  entityId?: number;
  entityName?: string;
  details?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  req?: {
    ip?: string;
    headers?: {
      "user-agent"?: string;
      "x-forwarded-for"?: string;
    };
  };
}

/**
 * Log a user activity
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const ipAddress = params.req?.headers?.["x-forwarded-for"] || params.req?.ip || undefined;
    const userAgent = params.req?.headers?.["user-agent"] || undefined;

    await createActivityLog({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      details: params.details,
      oldValues: params.oldValues,
      newValues: params.newValues,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Don't throw - logging should not break the main operation
    console.error("[ActivityLogger] Failed to log activity:", error);
  }
}

// Convenience functions for common actions

export async function logCreate(
  userId: number,
  entityType: EntityType,
  entityId: number,
  entityName: string,
  details?: Record<string, any>
) {
  return logActivity({
    userId,
    action: "create",
    entityType,
    entityId,
    entityName,
    details,
  });
}

export async function logUpdate(
  userId: number,
  entityType: EntityType,
  entityId: number,
  entityName: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  return logActivity({
    userId,
    action: "update",
    entityType,
    entityId,
    entityName,
    oldValues,
    newValues,
  });
}

export async function logDelete(
  userId: number,
  entityType: EntityType,
  entityId: number,
  entityName: string
) {
  return logActivity({
    userId,
    action: "delete",
    entityType,
    entityId,
    entityName,
  });
}

export async function logView(
  userId: number,
  entityType: EntityType,
  entityId: number,
  entityName: string
) {
  return logActivity({
    userId,
    action: "view",
    entityType,
    entityId,
    entityName,
  });
}

export async function logExport(
  userId: number,
  entityType: EntityType,
  details: { count: number; format: string; filters?: Record<string, any> }
) {
  return logActivity({
    userId,
    action: "export",
    entityType,
    details,
  });
}

export async function logLogin(userId: number, req?: LogActivityParams["req"]) {
  return logActivity({
    userId,
    action: "login",
    entityType: "user",
    details: { message: "Bruker logget inn" },
    req,
  });
}

export async function logLogout(userId: number, req?: LogActivityParams["req"]) {
  return logActivity({
    userId,
    action: "logout",
    entityType: "user",
    details: { message: "Bruker logget ut" },
    req,
  });
}

export async function logEmailSend(
  userId: number,
  campaignId: number,
  campaignName: string,
  recipientCount: number
) {
  return logActivity({
    userId,
    action: "send",
    entityType: "campaign",
    entityId: campaignId,
    entityName: campaignName,
    details: { recipientCount, message: `Sendt til ${recipientCount} mottakere` },
  });
}

export async function logSync(
  userId: number,
  entityType: EntityType,
  details: { source: string; count: number }
) {
  return logActivity({
    userId,
    action: "sync",
    entityType,
    details,
  });
}

export async function logImport(
  userId: number,
  entityType: EntityType,
  details: { source: string; count: number; skipped?: number }
) {
  return logActivity({
    userId,
    action: "import",
    entityType,
    details,
  });
}
