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
import { apiRateLimiter, authRateLimiter } from "./rateLimit";
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
  
  // Security: CORS configuration - Allow all origins in production for now
  app.use(
    cors({
      origin: true, // Allow all origins
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    })
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Auth routes (login, register, logout)
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
