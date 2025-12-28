import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

export interface EmailVerificationResult {
  email: string;
  isValid: boolean;
  score: number; // 0-100
  checks: {
    format: boolean;
    domain: boolean;
    mx: boolean;
    disposable: boolean;
    roleAccount: boolean;
  };
  suggestion?: string;
  reason?: string;
}

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
  "maildrop.cc", "yopmail.com", "getnada.com", "tempail.com",
  "sharklasers.com", "spam4.me", "grr.la", "dispostable.com",
]);

// Common role-based email prefixes
const ROLE_PREFIXES = [
  "info", "admin", "support", "sales", "contact", "hello", "help",
  "office", "team", "noreply", "no-reply", "postmaster", "webmaster",
  "marketing", "billing", "abuse", "security", "hr", "jobs", "careers",
  "press", "media", "news", "feedback", "service", "enquiry", "inquiry",
  "post", "kontakt", "kundeservice", "salg", "marked", "regnskap",
];

// Common Norwegian email providers
const VALID_NORWEGIAN_PROVIDERS = new Set([
  "gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "live.com",
  "online.no", "telenor.com", "broadpark.no", "getmail.no", "frisurf.no",
  "start.no", "c2i.net", "lyse.net", "altibox.no", "telia.com",
]);

/**
 * Validate email format using regex
 */
function validateFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email
 */
function extractDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

/**
 * Check if domain is disposable
 */
function isDisposable(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Check if email is a role account
 */
function isRoleAccount(email: string): boolean {
  const localPart = email.split("@")[0]?.toLowerCase() || "";
  return ROLE_PREFIXES.some(prefix => 
    localPart === prefix || localPart.startsWith(prefix + ".")
  );
}

/**
 * Check MX records for domain
 */
async function checkMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Calculate verification score
 */
function calculateScore(checks: EmailVerificationResult["checks"]): number {
  let score = 0;
  
  if (checks.format) score += 30;
  if (checks.domain) score += 20;
  if (checks.mx) score += 30;
  if (!checks.disposable) score += 10;
  if (!checks.roleAccount) score += 10;
  
  return score;
}

/**
 * Suggest email correction for common typos
 */
function suggestCorrection(email: string): string | undefined {
  const domain = extractDomain(email);
  const localPart = email.split("@")[0];
  
  const corrections: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gnail.com": "gmail.com",
    "hotmal.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "outlok.com": "outlook.com",
    "outloo.com": "outlook.com",
    "yahooo.com": "yahoo.com",
    "yaho.com": "yahoo.com",
  };
  
  if (corrections[domain]) {
    return `${localPart}@${corrections[domain]}`;
  }
  
  return undefined;
}

/**
 * Verify a single email address
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const domain = extractDomain(normalizedEmail);
  
  const checks = {
    format: validateFormat(normalizedEmail),
    domain: domain.length > 0 && domain.includes("."),
    mx: false,
    disposable: isDisposable(domain),
    roleAccount: isRoleAccount(normalizedEmail),
  };
  
  // Only check MX if format is valid
  if (checks.format && checks.domain) {
    checks.mx = await checkMxRecords(domain);
  }
  
  const score = calculateScore(checks);
  const suggestion = suggestCorrection(normalizedEmail);
  
  let reason: string | undefined;
  if (!checks.format) {
    reason = "Ugyldig e-postformat";
  } else if (!checks.mx) {
    reason = "Domenet har ingen e-postserver (MX-post)";
  } else if (checks.disposable) {
    reason = "Midlertidig/engangs e-postadresse";
  }
  
  return {
    email: normalizedEmail,
    isValid: checks.format && checks.mx && !checks.disposable,
    score,
    checks,
    suggestion,
    reason,
  };
}

/**
 * Verify multiple emails in batch
 */
export async function verifyEmailBatch(
  emails: string[],
  concurrency: number = 5
): Promise<EmailVerificationResult[]> {
  const results: EmailVerificationResult[] = [];
  
  // Process in batches
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(verifyEmail));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Quick format check (no network calls)
 */
export function quickValidate(email: string): {
  isValid: boolean;
  reason?: string;
} {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!validateFormat(normalizedEmail)) {
    return { isValid: false, reason: "Ugyldig format" };
  }
  
  const domain = extractDomain(normalizedEmail);
  
  if (isDisposable(domain)) {
    return { isValid: false, reason: "Midlertidig e-post ikke tillatt" };
  }
  
  return { isValid: true };
}
