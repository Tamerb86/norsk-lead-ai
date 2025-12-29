import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import crypto from "crypto";

// Configure authenticator
authenticator.options = {
  window: 1, // Allow 1 step before/after for time drift
};

const APP_NAME = "NorskLeads";

/**
 * Generate a new 2FA secret for a user
 */
export function generateSecret(email: string): { secret: string; otpAuthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(email, APP_NAME, secret);
  return { secret, otpAuthUrl };
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Verify a TOTP token
 */
export function verifyToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

/**
 * Verify a backup code against stored hashes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): { valid: boolean; index: number } {
  const hashedInput = hashBackupCode(code);
  const index = hashedCodes.findIndex((hash) => hash === hashedInput);
  return { valid: index !== -1, index };
}

/**
 * Encrypt secret for storage (using a simple encryption)
 */
export function encryptSecret(secret: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(key).digest(),
    iv
  );
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt secret from storage
 */
export function decryptSecret(encryptedSecret: string, key: string): string {
  const [ivHex, encrypted] = encryptedSecret.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    crypto.createHash("sha256").update(key).digest(),
    iv
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
