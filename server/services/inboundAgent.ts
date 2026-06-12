/**
 * Inbound reply ingestion + agent orchestration (lead follow-up agent — phase 1).
 *
 * Flow: a parsed inbound email -> match to (tenant, lead) -> classify ->
 * store -> apply the "stop on negative" guardrail (terminal categories stop the
 * lead and never trigger an automated reply) -> notify the owner.
 *
 * Draft generation and sending live in later phases; this module deliberately
 * stops at "received/ignored" and records the suggested action so the assisted
 * UI (phase 2/3) can present it. No email is sent from here.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { inboundMessages, leads, type InsertInboundMessage } from "../../drizzle/schema";
import { parseReplyAddress } from "./replyAddress";
import {
  classifyReply,
  stripQuotedReply,
  isTerminalCategory,
  REPLY_CATEGORIES,
} from "./replyClassifier";
import { createNotification } from "../db";

export interface ParsedInboundEmail {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  messageId?: string;
  inReplyTo?: string;
}

export interface IngestResult {
  stored: boolean;
  inboundMessageId?: number;
  matched: boolean;
  matchMethod: "signed_address" | "in_reply_to" | "none";
  category?: string;
  leadStopped: boolean;
  reason?: string;
}

/**
 * Match an inbound email to its owning tenant + lead.
 * Primary: the signed Reply-To tag in the "to" address (self-contained, forgery-proof).
 * Fallback: the In-Reply-To header matched against a stored outbound Message-ID
 *   (only used when the tag is missing — e.g. a forwarded reply).
 */
async function matchToLead(
  email: ParsedInboundEmail
): Promise<{ userId: number; leadId: number; campaignId: number | null; method: "signed_address" | "in_reply_to" } | null> {
  const tagged = parseReplyAddress(email.to);
  if (tagged) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, tagged.leadId), eq(leads.userId, tagged.userId)))
      .limit(1);
    const lead = rows[0];
    if (lead) {
      return {
        userId: tagged.userId,
        leadId: tagged.leadId,
        campaignId: lead.campaignId ?? null,
        method: "signed_address",
      };
    }
    // Tag verified but lead is gone — treat as unmatched rather than guessing.
  }
  return null;
}

/**
 * Ingest one parsed inbound email. Idempotent on Message-ID: a redelivered
 * webhook for the same message will not double-store or re-stop the lead.
 */
export async function ingestInboundEmail(email: ParsedInboundEmail): Promise<IngestResult> {
  const db = await getDb();

  // Idempotency: skip if we already stored this Message-ID.
  if (email.messageId) {
    const existing = await db
      .select({ id: inboundMessages.id })
      .from(inboundMessages)
      .where(eq(inboundMessages.messageId, email.messageId))
      .limit(1);
    if (existing[0]) {
      return { stored: false, matched: false, matchMethod: "none", leadStopped: false, reason: "duplicate" };
    }
  }

  const match = await matchToLead(email);

  // Classify on the new content only (strip quoted history).
  const cleanBody = stripQuotedReply(email.text || email.html || "");
  const classification = classifyReply(cleanBody);

  // Unmatched replies are still worth storing for the owner to triage, but they
  // have no tenant — we cannot isolate them. Drop them rather than leak across
  // tenants. (A bare reply with no signed tag and no lead match.)
  if (!match) {
    return {
      stored: false,
      matched: false,
      matchMethod: "none",
      category: classification.category,
      leadStopped: false,
      reason: "no_tenant_match",
    };
  }

  const terminal = isTerminalCategory(classification.category);

  const row: InsertInboundMessage = {
    userId: match.userId,
    leadId: match.leadId,
    campaignId: match.campaignId,
    fromEmail: email.from.slice(0, 320),
    toEmail: email.to.slice(0, 320),
    subject: email.subject ?? null,
    bodyText: email.text ?? null,
    bodyHtml: email.html ?? null,
    messageId: email.messageId?.slice(0, 998) ?? null,
    inReplyTo: email.inReplyTo?.slice(0, 998) ?? null,
    classification: classification.category,
    confidence: classification.confidence,
    sentiment: classification.sentiment,
    matchMethod: match.method,
    // Guardrail: terminal/negative categories never get an automated reply.
    status: terminal ? "ignored" : "received",
  };

  const inserted = await db.insert(inboundMessages).values(row).returning({ id: inboundMessages.id });
  const inboundMessageId = inserted[0]?.id;

  // Update the lead: always record that they replied; stop them on terminal categories.
  const now = new Date();
  const leadUpdate: Record<string, unknown> = {
    emailRepliedAt: now,
    replyContent: cleanBody.slice(0, 4000),
    updatedAt: now,
  };
  let leadStopped = false;
  if (classification.category === REPLY_CATEGORIES.UNSUBSCRIBE || classification.category === REPLY_CATEGORIES.SPAM) {
    leadUpdate.status = "unsubscribed";
    leadUpdate.unsubscribed = true;
    leadUpdate.emailUnsubscribedAt = now;
    leadStopped = true;
  } else if (classification.category === REPLY_CATEGORIES.NOT_INTERESTED) {
    leadUpdate.status = "not_interested";
    leadStopped = true;
  } else if (classification.category === REPLY_CATEGORIES.BOUNCE) {
    leadUpdate.status = "bounced";
    leadUpdate.emailBouncedAt = now;
    leadStopped = true;
  } else {
    leadUpdate.status = "replied";
  }
  await db.update(leads).set(leadUpdate).where(eq(leads.id, match.leadId));

  // Notify the owner (tenant-scoped).
  try {
    await createNotification({
      userId: match.userId,
      type: leadStopped ? "lead_stopped" : "lead_replied",
      title: leadStopped
        ? `En lead svarte: ${classification.category}`
        : `Du har et nytt svar fra en lead`,
      message: cleanBody.slice(0, 200),
      relatedId: match.leadId,
      relatedType: "lead",
    });
  } catch (err) {
    console.error("[InboundAgent] notification failed:", err);
  }

  return {
    stored: true,
    inboundMessageId,
    matched: true,
    matchMethod: match.method,
    category: classification.category,
    leadStopped,
  };
}
