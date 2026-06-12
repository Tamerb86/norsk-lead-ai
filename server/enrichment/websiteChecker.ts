import https from "https";
import http from "http";
import { URL } from "url";
import { assertPublicUrl } from "./urlGuard";

export type WebsiteCheckResult = {
  url: string;
  isValid: boolean;
  status: "online" | "offline" | "error" | "unknown";
  checks: {
    reachable: boolean;
    ssl: boolean;
    redirects: boolean;
    statusCode: number | null;
  };
  metadata: {
    finalUrl: string | null;
    responseTime: number | null; // in milliseconds
    contentType: string | null;
    server: string | null;
  };
  score: number; // 0-100
  reason?: string;
};

/**
 * Normalize URL (add protocol if missing)
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim().toLowerCase();

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, "");

  // Add protocol if missing
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

/**
 * Check if URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Make HTTP/HTTPS request with timeout
 */
const MAX_REDIRECTS = 3;

async function makeRequest(
  url: string,
  timeout: number = 10000,
  redirectDepth: number = 0,
  visitedUrls: Set<string> = new Set()
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  redirected: boolean;
  finalUrl: string;
  responseTime: number;
}> {
  if (redirectDepth > MAX_REDIRECTS) {
    throw new Error("Too many redirects");
  }
  if (visitedUrls.has(url)) {
    throw new Error("Redirect loop detected");
  }
  visitedUrls.add(url);

  // SSRF guard: block private/internal targets (also on every redirect hop)
  await assertPublicUrl(url);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "HEAD",
      timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadEnrichmentBot/1.0; +https://example.com/bot)",
      },
    };

    const req = protocol.request(options, (res) => {
      const responseTime = Date.now() - startTime;

      // Handle redirects
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        makeRequest(redirectUrl, timeout, redirectDepth + 1, visitedUrls)
          .then((result) => {
            resolve({
              ...result,
              redirected: true,
            });
          })
          .catch(reject);
        return;
      }

      resolve({
        statusCode: res.statusCode || 0,
        headers: res.headers,
        redirected: false,
        finalUrl: url,
        responseTime,
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * Check website availability and SSL
 */
export async function checkWebsite(
  url: string
): Promise<WebsiteCheckResult> {
  const normalized = normalizeUrl(url);

  // Validate URL syntax
  if (!isValidUrl(normalized)) {
    return {
      url,
      isValid: false,
      status: "error",
      checks: {
        reachable: false,
        ssl: false,
        redirects: false,
        statusCode: null,
      },
      metadata: {
        finalUrl: null,
        responseTime: null,
        contentType: null,
        server: null,
      },
      score: 0,
      reason: "Invalid URL format",
    };
  }

  try {
    const result = await makeRequest(normalized);

    const isHttps = normalized.startsWith("https://");
    const isReachable = result.statusCode >= 200 && result.statusCode < 400;

    const checks = {
      reachable: isReachable,
      ssl: isHttps,
      redirects: result.redirected,
      statusCode: result.statusCode,
    };

    // Calculate score
    let score = 0;
    if (checks.reachable) score += 50;
    if (checks.ssl) score += 30;
    if (checks.statusCode === 200) score += 20;

    // Determine status
    let status: WebsiteCheckResult["status"] = "unknown";
    let reason: string | undefined;

    if (isReachable) {
      status = "online";
    } else if (result.statusCode >= 400 && result.statusCode < 500) {
      status = "error";
      reason = `Client error: ${result.statusCode}`;
    } else if (result.statusCode >= 500) {
      status = "offline";
      reason = `Server error: ${result.statusCode}`;
    } else {
      status = "unknown";
      reason = `Unexpected status code: ${result.statusCode}`;
    }

    return {
      url,
      isValid: isReachable,
      status,
      checks,
      metadata: {
        finalUrl: result.finalUrl,
        responseTime: result.responseTime,
        contentType: result.headers["content-type"] || null,
        server: (Array.isArray(result.headers.server) ? result.headers.server[0] : result.headers.server) || null,
      },
      score,
      reason,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      url,
      isValid: false,
      status: "offline",
      checks: {
        reachable: false,
        ssl: normalized.startsWith("https://"),
        redirects: false,
        statusCode: null,
      },
      metadata: {
        finalUrl: null,
        responseTime: null,
        contentType: null,
        server: null,
      },
      score: 0,
      reason: `Connection failed: ${errorMessage}`,
    };
  }
}

/**
 * Batch check multiple websites
 */
export async function checkWebsites(
  urls: string[]
): Promise<WebsiteCheckResult[]> {
  return Promise.all(urls.map((url) => checkWebsite(url)));
}

/**
 * Extract domain from email
 */
export function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : null;
}
