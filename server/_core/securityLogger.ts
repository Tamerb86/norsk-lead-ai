/**
 * Security Logger
 * Logs security-related events for monitoring and incident response
 */

export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST",
  REGISTRATION = "REGISTRATION",
  ADMIN_ACCESS = "ADMIN_ACCESS",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  DATA_EXPORT = "DATA_EXPORT",
  USER_DELETED = "USER_DELETED",
  ROLE_CHANGED = "ROLE_CHANGED",
  TOKEN_REFRESH = "TOKEN_REFRESH",
  TOKEN_REUSE_DETECTED = "TOKEN_REUSE_DETECTED",
  TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED",
}

interface SecurityEvent {
  type: SecurityEventType;
  userId?: number | string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Log a security event
 * In production, this should be sent to a centralized logging service
 */
export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">) {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  // Format for structured logging
  const logEntry = {
    level: getLogLevel(event.type),
    category: "SECURITY",
    ...fullEvent,
  };

  // Log to console (in production, send to logging service)
  if (logEntry.level === "error" || logEntry.level === "warn") {
    console.warn(`[SECURITY] ${JSON.stringify(logEntry)}`);
  } else {
    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
  }

  // TODO: In production, send to:
  // - Sentry for error tracking
  // - CloudWatch/Datadog for log aggregation
  // - SIEM for security monitoring
}

function getLogLevel(type: SecurityEventType): "info" | "warn" | "error" {
  switch (type) {
    case SecurityEventType.LOGIN_FAILURE:
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
    case SecurityEventType.UNAUTHORIZED_ACCESS:
      return "warn";
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      return "error";
    default:
      return "info";
  }
}

/**
 * Extract client info from request
 */
export function getClientInfo(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}) {
  return {
    ip: req.ip || req.headers?.["x-forwarded-for"]?.toString() || "unknown",
    userAgent: req.headers?.["user-agent"]?.toString() || "unknown",
  };
}
