import net from "net";
import { promises as dns } from "dns";

/**
 * SSRF guard for outbound requests to user-supplied URLs (website scraping,
 * website checks, outgoing webhooks). Blocks loopback/private/link-local
 * targets so a crafted URL can't reach internal services or cloud metadata
 * endpoints (e.g. 169.254.169.254).
 *
 * Residual risk: DNS rebinding between validation and the actual request is
 * not prevented (would require a pinned-IP HTTP agent).
 */

const BLOCKED_HOSTNAMES = /^(localhost|.+\.local|.+\.internal|.+\.localhost)$/i;

export function isPrivateIp(ip: string): boolean {
  // IPv6-mapped IPv4 (::ffff:10.0.0.1)
  const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);

  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) || // link-local / cloud metadata
      a >= 224 // multicast + reserved
    );
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fe80:") || // link-local
      lower.startsWith("fc") || // unique-local fc00::/7
      lower.startsWith("fd")
    );
  }

  return false;
}

/**
 * Validate that a URL is http(s) and does not point at a private/internal
 * host. Resolves DNS so domains A-recorded to internal IPs are also caught.
 * Throws on violation; returns the parsed URL otherwise.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Blocked protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  if (BLOCKED_HOSTNAMES.test(hostname)) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error(`Blocked private IP: ${hostname}`);
    }
    return parsed;
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const { address } of addresses) {
      if (isPrivateIp(address)) {
        throw new Error(`Blocked: ${hostname} resolves to private IP ${address}`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Blocked")) {
      throw error;
    }
    throw new Error(`DNS resolution failed for ${hostname}`);
  }

  return parsed;
}

/**
 * Synchronous variant for places that can't await DNS (literal hostname/IP
 * checks only).
 */
export function isBlockedUrlSync(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
    if (BLOCKED_HOSTNAMES.test(hostname)) return true;
    if (net.isIP(hostname) && isPrivateIp(hostname)) return true;
    return false;
  } catch {
    return true;
  }
}
