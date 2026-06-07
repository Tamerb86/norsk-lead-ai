/**
 * SendGrid Webhook Handler
 * Handles delivery events from SendGrid (delivered, open, click, bounce, spam, unsubscribe)
 */

import { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import { emailEvents, leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * SendGrid Event Types
 */
type SendGridEventType =
  | "processed"
  | "dropped"
  | "delivered"
  | "deferred"
  | "bounce"
  | "open"
  | "click"
  | "spam_report"
  | "unsubscribe"
  | "group_unsubscribe"
  | "group_resubscribe";

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: SendGridEventType;
  sg_event_id: string;
  sg_message_id: string;
  trackingId?: string; // Custom arg we add
  campaignId?: string; // Custom arg we add
  url?: string; // For click events
  useragent?: string;
  ip?: string;
  reason?: string; // For bounce/drop events
  status?: string; // For bounce events
  type?: string; // For bounce events (blocked, bounce, etc.)
}

/**
 * Map SendGrid event types to our internal event types
 */
function mapEventType(sgEvent: SendGridEventType): "open" | "click" | "bounce" | "unsubscribe" | "reply" | null {
  switch (sgEvent) {
    case "open":
      return "open";
    case "click":
      return "click";
    case "bounce":
    case "dropped":
    case "deferred":
      return "bounce";
    case "spam_report":
    case "unsubscribe":
    case "group_unsubscribe":
      return "unsubscribe";
    default:
      return null; // Ignore other events
  }
}

/**
 * Handle SendGrid webhook events
 */
export async function handleSendGridWebhook(req: Request, res: Response) {
  try {
    const events: SendGridEvent[] = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "Invalid payload - expected array" });
    }

    console.log(`📬 Received ${events.length} SendGrid events`);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Process each event
    for (const event of events) {
      try {
        // Map event type
        const eventType = mapEventType(event.event);
        if (!eventType) {
          console.log(`⏭️ Skipping event type: ${event.event}`);
          continue;
        }

        // Get trackingId and campaignId from custom args
        const trackingId = event.trackingId;
        const campaignId = event.campaignId ? parseInt(event.campaignId) : null;

        if (!trackingId) {
          console.log(`⚠️ No trackingId in event ${event.sg_event_id}, skipping`);
          continue;
        }

        // Find lead by trackingId
        const leadResults = await db
          .select()
          .from(leads)
          .where(eq(leads.trackingId, trackingId))
          .limit(1);

        const lead = leadResults[0];
        if (!lead) {
          console.log(`⚠️ Lead not found for trackingId: ${trackingId}`);
          continue;
        }

        // Log event
        await db.insert(emailEvents).values({
          leadId: lead.id,
          campaignId: campaignId || lead.campaignId,
          trackingId,
          eventType,
          linkUrl: event.url || null,
          userAgent: event.useragent || null,
          ipAddress: event.ip || null,
          metadata: {
            sgEventId: event.sg_event_id,
            sgMessageId: event.sg_message_id,
            timestamp: event.timestamp,
            reason: event.reason,
            status: event.status,
            type: event.type,
          },
          createdAt: new Date(event.timestamp * 1000),
        });

        // Update lead status based on event
        const now = new Date();
        switch (eventType) {
          case "open":
            await db
              .update(leads)
              .set({
                status: "opened",
                emailOpenedAt: lead.emailOpenedAt || now,
                openCount: lead.openCount + 1,
                updatedAt: now,
              })
              .where(eq(leads.id, lead.id));
            break;

          case "click":
            await db
              .update(leads)
              .set({
                status: "clicked",
                emailClickedAt: lead.emailClickedAt || now,
                clickCount: lead.clickCount + 1,
                updatedAt: now,
              })
              .where(eq(leads.id, lead.id));
            break;

          case "bounce":
            await db
              .update(leads)
              .set({
                status: "bounced",
                emailBouncedAt: now,
                updatedAt: now,
              })
              .where(eq(leads.id, lead.id));
            break;

          case "unsubscribe":
            await db
              .update(leads)
              .set({
                status: "unsubscribed",
                unsubscribed: true,
                updatedAt: now,
              })
              .where(eq(leads.id, lead.id));
            break;
        }

        console.log(`✅ Processed ${eventType} event for lead ${lead.id}`);

      } catch (error: any) {
        console.error(`❌ Error processing event:`, error);
        // Continue processing other events even if one fails
      }
    }

    // Return 200 to acknowledge receipt
    res.status(200).json({ received: events.length });

  } catch (error: any) {
    console.error("❌ SendGrid webhook error:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Verify SendGrid webhook signature (optional but recommended)
 * https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
 */
export function verifySendGridSignature(req: Request): boolean {
  const verificationKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;

  if (!verificationKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ SENDGRID_WEBHOOK_VERIFICATION_KEY not set - rejecting webhook in production");
      return false;
    }
    console.warn("⚠️ SENDGRID_WEBHOOK_VERIFICATION_KEY not set - skipping verification (dev only)");
    return true;
  }

  const signature = req.headers["x-twilio-email-event-webhook-signature"];
  const timestamp = req.headers["x-twilio-email-event-webhook-timestamp"];
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (typeof signature !== "string" || typeof timestamp !== "string" || !rawBody) {
    return false;
  }

  try {
    // SendGrid verification key is a base64-encoded DER (SPKI) EC public key
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(verificationKey, "base64"),
      format: "der",
      type: "spki",
    });
    const payload = Buffer.concat([Buffer.from(timestamp, "utf8"), rawBody]);
    return crypto.verify("sha256", payload, publicKey, Buffer.from(signature, "base64"));
  } catch (error) {
    console.error("[SendGrid Webhook] Signature verification error:", error);
    return false;
  }
}
