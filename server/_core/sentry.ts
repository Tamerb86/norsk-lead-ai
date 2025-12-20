import * as Sentry from "@sentry/node";
import { ENV } from "./env";

/**
 * Initialize Sentry error tracking
 * Only enabled in production with valid DSN
 */
export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.log("ℹ️ [Sentry] SENTRY_DSN not configured, error tracking disabled");
    return;
  }

  // Allow Sentry in both development and production for testing
  // if (!ENV.isProduction) {
  //   console.log("ℹ️ [Sentry] Skipping initialization in development mode");
  //   return;
  // }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: ENV.isProduction ? "production" : "development",
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Release tracking
      release: process.env.RAILWAY_GIT_COMMIT_SHA || "development",
      
      // Error filtering
      beforeSend(event, hint) {
        // Allow errors in development for testing (comment out to disable)
        // if (!ENV.isProduction) {
        //   return null;
        // }
        
        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip validation errors (user input errors)
          if (error.message.includes("validation") || error.message.includes("Invalid")) {
            return null;
          }
        }
        
        return event;
      },
      
      // Integrations
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
    });

    console.log("✅ [Sentry] Error tracking initialized");
  } catch (error) {
    console.error("❌ [Sentry] Failed to initialize:", error);
  }
}

/**
 * Setup Express error handler
 * Call this function with your Express app after all routes
 */
export function setupSentryErrorHandler(app: any) {
  Sentry.setupExpressErrorHandler(app);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}
