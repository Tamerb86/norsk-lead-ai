import crypto from "crypto";
import { ENV } from "../_core/env";

/**
 * Tagged reply addresses for the lead follow-up agent.
 *
 * Each outbound campaign email sets Reply-To to a per-(tenant,lead) address:
 *   reply+{userId}-{leadId}-{token}@{REPLY_DOMAIN}
 * where token is an HMAC over "userId|leadId" keyed by APP_SECRET. When the
 * lead replies, SendGrid Inbound Parse delivers it to us and we recover the
 * owning tenant + lead from the address — and reject forged/edited tags via
 * the HMAC. This keeps every inbound reply isolated to one customer with no
 * shared platform inbox.
 *
 * Threading is therefore self-contained in the address: we do not depend on
 * the lead's mail client preserving In-Reply-To (that's only a fallback).
 */

function token(userId: number, leadId: number): string {
  return crypto
    .createHmac("sha256", ENV.appSecret)
    .update(`reply:${userId}:${leadId}`)
    .digest("hex")
    .slice(0, 16);
}

/** Build the Reply-To address for a given tenant + lead. */
export function buildReplyAddress(userId: number, leadId: number): string {
  return `reply+${userId}-${leadId}-${token(userId, leadId)}@${ENV.replyDomain}`;
}

export interface ParsedReplyAddress {
  userId: number;
  leadId: number;
}

/**
 * Recover and verify (userId, leadId) from an inbound "To" address.
 * Returns null if the address is not one of ours or the HMAC doesn't match
 * (forged/tampered) — callers must treat null as "could not match".
 */
export function parseReplyAddress(toAddress: string): ParsedReplyAddress | null {
  if (!toAddress) return null;

  // Pull the local part out of "Name <reply+...@domain>" or a bare address.
  const angle = toAddress.match(/<([^>]+)>/);
  const addr = (angle ? angle[1] : toAddress).trim().toLowerCase();

  const match = addr.match(/^reply\+(\d+)-(\d+)-([0-9a-f]{16})@(.+)$/);
  if (!match) return null;

  const userId = Number(match[1]);
  const leadId = Number(match[2]);
  const providedToken = match[3];

  if (!Number.isInteger(userId) || !Number.isInteger(leadId)) return null;

  const expected = token(userId, leadId);
  // Constant-time compare to avoid token-guessing via timing.
  const a = Buffer.from(providedToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return { userId, leadId };
}
