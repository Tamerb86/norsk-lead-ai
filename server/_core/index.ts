import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./authRoutes";
import { registerAdminRoutes } from "./adminRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import trackingRoutes from "../trackingRoutes";
import { initSentry, setupSentryErrorHandler } from "./sentry";
import { apiRateLimiter, authRateLimiter, checkLockout, registrationRateLimiter, passwordResetRateLimiter } from "./rateLimit";
import { ENV } from "./env";
import { initializeSchedulers } from "../services/enrichmentScheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize Sentry first
  initSentry();
  
  const app = express();
  const server = createServer(app);
  
  // Trust proxy for Railway/reverse proxy deployments
  // This is required for express-rate-limit to work correctly
  app.set('trust proxy', 1);
  
  // Security: Helmet for security headers with enhanced CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://maps.googleapis.com", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://api.openai.com", "https://maps.googleapis.com", "https://*.amazonaws.com", "https://data.brreg.no", "wss:"],
          frameSrc: ["'self'", "https://js.stripe.com"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for Stripe
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    })
  );
  
  // Remove X-Powered-By header
  app.disable('x-powered-by');
  
  // Security: CORS configuration - Strict origin control
  const allowedOrigins = [
    "https://lead.nexifyhub.no",
    "https://www.lead.nexifyhub.no",
    "https://norskleads.com",
    "https://www.norskleads.com",
    "https://app.norskleads.com",
    // Development origins (only in non-production)
    ...(ENV.isProduction ? [] : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ]),
  ];
  
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Log blocked origins in production
        if (ENV.isProduction) {
          console.warn(`[CORS] Blocked request from origin: ${origin}`);
        }
        
        return callback(new Error("Not allowed by CORS"), false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
      maxAge: 86400, // Cache preflight for 24 hours
    })
  );
  
  // Health check for load balancers / orchestrators (plain HTTP GET, no auth)
  app.get("/health", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "degraded" });
    }
  });

  // Stripe webhook needs the raw body for signature verification,
  // so it MUST be registered before express.json()
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const { handleStripeWebhook } = await import("../stripeWebhook");
      await handleStripeWebhook(req, res);
    } catch (error) {
      // An async error here would otherwise become an unhandled rejection
      // and take the whole process down.
      console.error("[Stripe Webhook] Handler error:", error);
      if (!res.headersSent) res.status(500).send("Webhook error");
    }
  });

  // SendGrid Inbound Parse (lead replies) — multipart/form-data, so it must be
  // registered BEFORE express.json()/urlencoded() which would consume the stream.
  app.post("/api/sendgrid/inbound", async (req, res) => {
    try {
      const { handleInboundEmail } = await import("../inboundWebhook");
      await handleInboundEmail(req, res);
    } catch (error) {
      console.error("[Inbound Webhook] Handler error:", error);
      if (!res.headersSent) res.status(200).send("ok");
    }
  });

  // Body parser. rawBody is kept for webhook signature verification (SendGrid).
  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  
  // Auth routes with advanced rate limiting
  // Login: strict rate limit + lockout check
  app.use("/api/auth/login", authRateLimiter, checkLockout);
  // Register: separate rate limit
  app.use("/api/auth/register", registrationRateLimiter);
  // Password reset: strict rate limit
  app.use("/api/auth/forgot-password", passwordResetRateLimiter);
  // Other auth routes: general auth rate limit
  app.use("/api/auth", authRateLimiter);
  registerAuthRoutes(app);
  
  // Admin routes
  registerAdminRoutes(app);
  // Email tracking routes
  app.use("/api/track", trackingRoutes);
  
  // SendGrid webhook endpoint
  app.post("/api/sendgrid/webhook", async (req, res) => {
    try {
      const { handleSendGridWebhook, verifySendGridSignature } = await import("../sendgridWebhook");

      if (!verifySendGridSignature(req)) {
        const { logSecurityEvent, SecurityEventType, getClientInfo } = await import("./securityLogger");
        logSecurityEvent({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          ...getClientInfo(req),
          details: { reason: "SendGrid webhook signature verification failed" },
        });
        return res.status(401).json({ error: "Invalid signature" });
      }

      await handleSendGridWebhook(req, res);
    } catch (error) {
      console.error("[SendGrid Webhook] Handler error:", error);
      if (!res.headersSent) res.status(500).send("Webhook error");
    }
  });
  // tRPC API with rate limiting
  app.use(
    "/api/trpc",
    apiRateLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Sentry error handler (must be after all routes)
  setupSentryErrorHandler(app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  // In production the platform routes traffic to $PORT — never bind elsewhere.
  const port = ENV.isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Initialize enrichment schedulers
    if (process.env.NODE_ENV === 'production') {
      initializeSchedulers();
    } else {
      console.log('[Schedulers] Skipped in development mode');
    }
  });

  // Graceful shutdown: stop accepting connections, then close the DB pool
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Shutdown] Received ${signal}, closing server...`);
    // Force-exit if connections refuse to drain
    const forceTimer = setTimeout(() => {
      console.error("[Shutdown] Timed out waiting for connections, forcing exit");
      process.exit(1);
    }, 15000);
    forceTimer.unref();
    server.close(async () => {
      try {
        const { closeDb } = await import("../db");
        await closeDb();
        console.log("[Shutdown] Database pool closed, exiting");
      } catch (error) {
        console.error("[Shutdown] Error closing database pool:", error);
      }
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Last-resort safety net: log instead of letting a stray rejection kill
  // the server (Node's default since v15 is to crash the process).
  process.on("unhandledRejection", (reason) => {
    console.error("[Fatal] Unhandled promise rejection:", reason);
  });
}

startServer().catch(console.error);
