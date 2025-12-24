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
  
  // Security: Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://manus-analytics.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://manus-analytics.com"],
          frameSrc: ["'self'", "https://js.stripe.com"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for Stripe
    })
  );
  
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
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
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
  
  // Stripe webhook endpoint (MUST be before express.json())
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const { handleStripeWebhook } = await import("../stripeWebhook");
    await handleStripeWebhook(req, res);
  });
  
  // SendGrid webhook endpoint
  app.post("/api/sendgrid/webhook", async (req, res) => {
    const { handleSendGridWebhook, verifySendGridSignature } = await import("../sendgridWebhook");
    
    // Verify signature (optional but recommended)
    if (!verifySendGridSignature(req)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    await handleSendGridWebhook(req, res);
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
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
