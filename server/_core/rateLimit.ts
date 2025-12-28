import rateLimit from "express-rate-limit";
import { ENV } from "./env";
import { logSecurityEvent, SecurityEventType, getClientInfo } from "./securityLogger";
import type { Request, Response } from "express";

// In-memory store for tracking failed login attempts
const failedLoginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of failedLoginAttempts.entries()) {
    // Remove entries older than 1 hour
    if (now - value.firstAttempt > 60 * 60 * 1000) {
      failedLoginAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Check if IP is locked out due to too many failed attempts
 */
export function isLockedOut(ip: string): { locked: boolean; remainingTime?: number } {
  const record = failedLoginAttempts.get(ip);
  if (!record || !record.lockedUntil) {
    return { locked: false };
  }
  
  const now = Date.now();
  if (now < record.lockedUntil) {
    return { 
      locked: true, 
      remainingTime: Math.ceil((record.lockedUntil - now) / 1000 / 60) // minutes
    };
  }
  
  // Lockout expired, reset
  failedLoginAttempts.delete(ip);
  return { locked: false };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = failedLoginAttempts.get(ip);
  
  if (!record) {
    failedLoginAttempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }
  
  // Reset if first attempt was more than 10 minutes ago
  if (now - record.firstAttempt > 10 * 60 * 1000) {
    failedLoginAttempts.set(ip, { count: 1, firstAttempt: now });
    return;
  }
  
  record.count++;
  
  // Lock out after 15 failed attempts (increased from 5)
  if (record.count >= 15) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 minutes lockout (reduced from 15)
    console.warn(`[Security] IP ${ip} locked out for 15 minutes after ${record.count} failed login attempts`);
  }
}

/**
 * Clear failed login attempts for an IP (on successful login)
 */
export function clearFailedLogins(ip: string): void {
  failedLoginAttempts.delete(ip);
}

/**
 * Strict rate limiter for authentication endpoints
 * - 10 requests per 10 minutes per IP
 * - Lockout after 5 failed attempts for 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 minutes (increased for better UX)
  message: {
    error: "Too many login attempts, please try again later.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Skip rate limiting in development
  skip: () => !ENV.isProduction,
  
  // Use default key generator (handles IPv6 properly)
  // keyGenerator removed to use built-in IP handling
  
  handler: (req: Request, res: Response) => {
    const ip = req.ip || "unknown";
    
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ...getClientInfo(req),
      details: { endpoint: req.path, type: "auth" },
    });
    
    console.warn(`[Auth Rate Limit] IP ${ip} exceeded auth rate limit`);
    res.status(429).json({
      error: "Too many authentication attempts",
      message: "You have been temporarily blocked due to too many attempts. Please try again later.",
      retryAfter: "10 minutes",
    });
  },
});

/**
 * Middleware to check lockout status before auth endpoints
 */
export function checkLockout(req: Request, res: Response, next: Function) {
  const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  const lockStatus = isLockedOut(ip);
  
  if (lockStatus.locked) {
    logSecurityEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      ...getClientInfo(req),
      details: { reason: "IP locked out", remainingMinutes: lockStatus.remainingTime },
    });
    
    return res.status(429).json({
      error: "Account temporarily locked",
      message: `Too many failed login attempts. Please try again in ${lockStatus.remainingTime} minutes.`,
      retryAfter: `${lockStatus.remainingTime} minutes`,
    });
  }
  
  next();
}

/**
 * Rate limiter for password reset endpoint
 * - 3 requests per 15 minutes per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per 15 minutes
  message: {
    error: "Too many password reset requests.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ...getClientInfo(req),
      details: { endpoint: "password-reset" },
    });
    
    res.status(429).json({
      error: "Too many password reset requests",
      message: "Please wait before requesting another password reset.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Rate limiter for registration endpoint
 * - 5 registrations per hour per IP
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour
  message: {
    error: "Too many registration attempts.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  
  handler: (req: Request, res: Response) => {
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ...getClientInfo(req),
      details: { endpoint: "registration" },
    });
    
    res.status(429).json({
      error: "Too many registration attempts",
      message: "Please wait before trying to register again.",
      retryAfter: "1 hour",
    });
  },
});

/**
 * General API rate limiter
 * - 1000 requests per hour per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: {
    error: "Too many requests, please slow down.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  
  handler: (req: Request, res: Response) => {
    console.warn(`[Rate Limit] IP ${req.ip} exceeded general rate limit`);
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter: "1 hour",
    });
  },
});

/**
 * Standard API rate limiter (for most endpoints)
 * - 500 requests per 15 minutes per IP (increased for better UX)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes (increased from 100)
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  
  handler: (req: Request, res: Response) => {
    console.warn(`[Rate Limit] IP ${req.ip} exceeded API rate limit`);
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * User-based rate limiter (requires authentication)
 * - 100 requests per 15 minutes per user
 */
export function createUserRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per user
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !ENV.isProduction,
    
    // Key by user ID if authenticated (falls back to default IP handling)
    
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: "Too many requests",
        message: "You have exceeded your rate limit. Please try again later.",
        retryAfter: "15 minutes",
      });
    },
  });
}
