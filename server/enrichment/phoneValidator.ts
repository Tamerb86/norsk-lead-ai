export type PhoneValidationResult = {
  phone: string;
  isValid: boolean;
  status: "valid" | "invalid" | "unknown";
  formatted: string | null;
  type: "mobile" | "landline" | "unknown";
  country: string;
  checks: {
    syntax: boolean;
    length: boolean;
    prefix: boolean;
  };
  score: number; // 0-100
  reason?: string;
};

// Norwegian phone number prefixes
const NORWEGIAN_MOBILE_PREFIXES = [
  "4", // Mobile
  "9", // Mobile
];

const NORWEGIAN_LANDLINE_PREFIXES = [
  "2", // Oslo
  "3", // Eastern Norway
  "5", // Western Norway
  "6", // Trøndelag
  "7", // Northern Norway
];

/**
 * Normalize phone number by removing spaces, dashes, parentheses
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, "");
}

/**
 * Check if phone number is Norwegian
 */
function isNorwegianPhone(normalized: string): boolean {
  // Norwegian numbers: +47 followed by 8 digits
  // Or just 8 digits starting with valid prefix
  if (normalized.startsWith("47") && normalized.length === 10) {
    return true;
  }
  if (normalized.length === 8) {
    return true;
  }
  return false;
}

/**
 * Extract Norwegian phone number (remove country code)
 */
function extractNorwegianNumber(normalized: string): string {
  if (normalized.startsWith("47") && normalized.length === 10) {
    return normalized.substring(2);
  }
  return normalized;
}

/**
 * Determine phone type (mobile or landline)
 */
function determinePhoneType(
  number: string
): "mobile" | "landline" | "unknown" {
  const firstDigit = number[0];

  if (NORWEGIAN_MOBILE_PREFIXES.includes(firstDigit)) {
    return "mobile";
  }

  if (NORWEGIAN_LANDLINE_PREFIXES.includes(firstDigit)) {
    return "landline";
  }

  return "unknown";
}

/**
 * Format Norwegian phone number
 */
function formatNorwegianPhone(number: string): string {
  // Format as: +47 XXX XX XXX
  if (number.length === 8) {
    return `+47 ${number.substring(0, 3)} ${number.substring(3, 5)} ${number.substring(5)}`;
  }
  return `+47 ${number}`;
}

/**
 * Validate Norwegian phone number
 */
export function validatePhone(phone: string): PhoneValidationResult {
  const normalized = normalizePhone(phone);

  // Check if it's a Norwegian number
  const isNorwegian = isNorwegianPhone(normalized);
  if (!isNorwegian) {
    return {
      phone,
      isValid: false,
      status: "invalid",
      formatted: null,
      type: "unknown",
      country: "unknown",
      checks: {
        syntax: false,
        length: false,
        prefix: false,
      },
      score: 0,
      reason: "Not a valid Norwegian phone number",
    };
  }

  // Extract the 8-digit number
  const number = extractNorwegianNumber(normalized);

  // Validate length
  const lengthValid = number.length === 8;
  if (!lengthValid) {
    return {
      phone,
      isValid: false,
      status: "invalid",
      formatted: null,
      type: "unknown",
      country: "NO",
      checks: {
        syntax: true,
        length: false,
        prefix: false,
      },
      score: 30,
      reason: "Invalid phone number length (expected 8 digits)",
    };
  }

  // Check prefix
  const firstDigit = number[0];
  const prefixValid =
    NORWEGIAN_MOBILE_PREFIXES.includes(firstDigit) ||
    NORWEGIAN_LANDLINE_PREFIXES.includes(firstDigit);

  if (!prefixValid) {
    return {
      phone,
      isValid: false,
      status: "invalid",
      formatted: formatNorwegianPhone(number),
      type: "unknown",
      country: "NO",
      checks: {
        syntax: true,
        length: true,
        prefix: false,
      },
      score: 60,
      reason: "Invalid Norwegian phone prefix",
    };
  }

  // Determine type
  const type = determinePhoneType(number);

  // All checks passed
  return {
    phone,
    isValid: true,
    status: "valid",
    formatted: formatNorwegianPhone(number),
    type,
    country: "NO",
    checks: {
      syntax: true,
      length: true,
      prefix: true,
    },
    score: 100,
  };
}

/**
 * Batch validate multiple phone numbers
 */
export function validatePhones(phones: string[]): PhoneValidationResult[] {
  return phones.map((phone) => validatePhone(phone));
}

/**
 * Extract all phone numbers from text
 */
export function extractPhones(text: string): string[] {
  const phoneRegex =
    /(\+47\s?\d{3}\s?\d{2}\s?\d{3}|\d{8}|47\d{8}|\+47\d{8})/g;
  const matches = text.match(phoneRegex);
  return matches || [];
}
