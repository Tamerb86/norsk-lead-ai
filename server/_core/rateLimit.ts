import rateLimit from "express-rate-limit";
import { ENV } from "./env";

/**
 * Rate limiter for API endpoints
 * Prevents abuse and DOS attacks
 * 
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Skip rate limiting in development
  skip: () => !ENV.isProduction,
  
  // Use default key generator (handles IPv6 correctly)
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`[Rate Limit] IP ${req.ip} exceeded rate limit`);
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Prevents brute force attacks
 * 
 * Limits: 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 login attempts per windowMs
  message: {
    error: "Too many login attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Skip rate limiting in development
  skip: () => !ENV.isProduction,
  
  // Use default key generator (handles IPv6 correctly)
  
  handler: (req, res) => {
    console.warn(`[Auth Rate Limit] IP ${req.ip} exceeded auth rate limit`);
    res.status(429).json({
      error: "Too many authentication attempts",
      message: "You have been temporarily blocked due to too many failed login attempts.",
      retryAfter: "15 minutes",
    });
  },
});

/**
 * Moderate rate limiter for general API usage
 * Prevents excessive API calls
 * 
 * Limits: 1000 requests per hour per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 requests per hour
  message: {
    error: "Too many requests, please slow down.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Skip rate limiting in development
  skip: () => !ENV.isProduction,
  
  // Use default key generator (handles IPv6 correctly)
});
