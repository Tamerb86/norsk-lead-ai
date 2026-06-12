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

const isProduction = process.env.NODE_ENV === "production";

/**
 * Required secret: in production it must be long and not a known placeholder,
 * otherwise sessions/2FA/tracking signatures are trivially forgeable.
 */
const requiredSecret = (name: string): string => {
  const value = required(name);
  const placeholders = ["change-me", "changeme", "secret", "password", "example"];
  const looksLikePlaceholder = placeholders.some((p) => value.toLowerCase().includes(p));
  if (isProduction && (value.length < 32 || looksLikePlaceholder)) {
    throw new Error(
      `❌ ${name} is too weak for production (must be 32+ random characters).\n` +
      `Generate one with: openssl rand -base64 48`
    );
  }
  return value;
};

const jwtSecret = requiredSecret("JWT_SECRET");
const appSecretValue = optional("APP_SECRET") || jwtSecret;
if (isProduction && appSecretValue === jwtSecret) {
  console.warn(
    "⚠️ APP_SECRET is not set — falling back to JWT_SECRET. " +
    "Set a separate APP_SECRET so 2FA encryption and tracking signatures don't share the session signing key."
  );
}
if (process.env.APP_SECRET && isProduction && process.env.APP_SECRET.length < 32) {
  throw new Error("❌ APP_SECRET is too weak for production (must be 32+ random characters).");
}

export const ENV = {
  // Required variables (will throw if missing)
  appId: required("VITE_APP_ID"),
  cookieSecret: jwtSecret,
  // Secret for 2FA secret encryption and tracking-URL signing (falls back to JWT_SECRET)
  appSecret: appSecretValue,
  databaseUrl: required("DATABASE_URL"),
  
  // Clerk Auth
  clerkPublishableKey: optional("VITE_CLERK_PUBLISHABLE_KEY"),
  clerkSecretKey: optional("CLERK_SECRET_KEY"),
  
  // Optional variables
  ownerOpenId: optional("OWNER_OPEN_ID"),
  oAuthServerUrl: optional("OAUTH_SERVER_URL"),
  forgeApiUrl: optional("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: optional("BUILT_IN_FORGE_API_KEY"),
  
  // Stripe
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  
  // SendGrid
  sendgridApiKey: optional("SENDGRID_API_KEY"),

  // Domain used for tagged reply addresses (lead follow-up agent).
  // A SendGrid Inbound Parse MX record must point at this host.
  // Defaults to a reply.* subdomain of the sending domain if unset.
  replyDomain: optional("REPLY_DOMAIN", "reply.nexifyhub.no"),

  // Computed
  isProduction,
};
