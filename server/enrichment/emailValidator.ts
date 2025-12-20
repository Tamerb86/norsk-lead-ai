import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

export type EmailValidationResult = {
  email: string;
  isValid: boolean;
  status: "valid" | "invalid" | "risky" | "unknown";
  checks: {
    syntax: boolean;
    domain: boolean;
    mxRecords: boolean;
    disposable: boolean;
  };
  score: number; // 0-100
  reason?: string;
};

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "getnada.com",
  "maildrop.cc",
  "trashmail.com",
  "yopmail.com",
]);

/**
 * Validate email syntax using RFC 5322 compliant regex
 */
function validateEmailSyntax(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Check if email domain is disposable/temporary
 */
function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

/**
 * Validate email domain and check MX records
 */
async function validateEmailDomain(
  domain: string
): Promise<{ valid: boolean; hasMx: boolean }> {
  try {
    const mxRecords = await resolveMx(domain);
    return {
      valid: true,
      hasMx: mxRecords && mxRecords.length > 0,
    };
  } catch (error) {
    return {
      valid: false,
      hasMx: false,
    };
  }
}

/**
 * Calculate email quality score (0-100)
 */
function calculateEmailScore(checks: EmailValidationResult["checks"]): number {
  let score = 0;

  if (checks.syntax) score += 30;
  if (checks.domain) score += 30;
  if (checks.mxRecords) score += 30;
  if (!checks.disposable) score += 10;

  return score;
}

/**
 * Validate email address with comprehensive checks
 */
export async function validateEmail(
  email: string
): Promise<EmailValidationResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // Check syntax
  const syntaxValid = validateEmailSyntax(normalizedEmail);
  if (!syntaxValid) {
    return {
      email: normalizedEmail,
      isValid: false,
      status: "invalid",
      checks: {
        syntax: false,
        domain: false,
        mxRecords: false,
        disposable: false,
      },
      score: 0,
      reason: "Invalid email syntax",
    };
  }

  // Extract domain
  const [, domain] = normalizedEmail.split("@");
  if (!domain) {
    return {
      email: normalizedEmail,
      isValid: false,
      status: "invalid",
      checks: {
        syntax: true,
        domain: false,
        mxRecords: false,
        disposable: false,
      },
      score: 30,
      reason: "Missing domain",
    };
  }

  // Check if disposable
  const disposable = isDisposableDomain(domain);

  // Validate domain and MX records
  const { valid: domainValid, hasMx } = await validateEmailDomain(domain);

  const checks = {
    syntax: syntaxValid,
    domain: domainValid,
    mxRecords: hasMx,
    disposable,
  };

  const score = calculateEmailScore(checks);

  // Determine status
  let status: EmailValidationResult["status"] = "unknown";
  let reason: string | undefined;

  // Disposable emails are always risky, regardless of score
  if (disposable) {
    status = "risky";
    reason = "Disposable email domain";
  } else if (score >= 90) {
    status = "valid";
  } else if (score >= 60) {
    status = "risky";
    reason = !hasMx
      ? "No MX records found"
      : "Domain validation incomplete";
  } else {
    status = "invalid";
    reason = !domainValid
      ? "Invalid domain"
      : !hasMx
        ? "No MX records found"
        : "Email validation failed";
  }

  return {
    email: normalizedEmail,
    isValid: status === "valid",
    status,
    checks,
    score,
    reason,
  };
}

/**
 * Batch validate multiple emails
 */
export async function validateEmails(
  emails: string[]
): Promise<EmailValidationResult[]> {
  return Promise.all(emails.map((email) => validateEmail(email)));
}
