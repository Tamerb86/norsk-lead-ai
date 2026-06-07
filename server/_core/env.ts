/**
 * Helper function to require environment variables
 * Throws an error if the variable is missing or empty
 */
const required = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `❌ Missing required environment variable: ${name}\n` +
      `Please set ${name} in your .env file or environment configuration.`
    );
  }
  return value;
};

/**
 * Optional environment variable with default fallback
 */
const optional = (name: string, defaultValue: string = ""): string => {
  return process.env[name] ?? defaultValue;
};

export const ENV = {
  // Required variables (will throw if missing)
  appId: required("VITE_APP_ID"),
  cookieSecret: required("JWT_SECRET"),
  // Secret for 2FA secret encryption and tracking-URL signing (falls back to JWT_SECRET)
  appSecret: optional("APP_SECRET") || required("JWT_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  
  // Clerk Auth
  clerkPublishableKey: optional("VITE_CLERK_PUBLISHABLE_KEY"),
  clerkSecretKey: optional("CLERK_SECRET_KEY"),
  
  // Optional variables
  ownerOpenId: optional("OWNER_OPEN_ID"),
  forgeApiUrl: optional("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: optional("BUILT_IN_FORGE_API_KEY"),
  
  // Stripe
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  
  // SendGrid
  sendgridApiKey: optional("SENDGRID_API_KEY"),
  
  // Computed
  isProduction: process.env.NODE_ENV === "production",
};
