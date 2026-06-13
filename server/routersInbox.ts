/**
 * Inbox router — lead replies (lead follow-up agent, phase 2).
 *
 * Serves the tenant-isolated reply inbox: every query filters on ctx.user.id,
 * mirroring how inbound_messages rows are written by the inbound agent.
 */
import { eq, and, desc, count } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as db from "./db";
import { inboundMessages, leads, norwegianCompanies, campaigns } from "../drizzle/schema";
import { isTerminalCategory, type ReplyCategory } from "./services/replyClassifier";

const STATUS_VALUES = ["received", "drafted", "replied", "ignored"] as const;

/** Hard cap on automated/assisted follow-ups per lead (anti-pestering guardrail). */
const MAX_FOLLOWUPS_PER_LEAD = 5;

/** Lead states that must never receive another follow-up. */
const STOPPED_LEAD_STATUSES = new Set(["unsubscribed", "not_interested", "bounced", "invalid"]);

async function getOwnedMessage(userId: number, id: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(inboundMessages)
    .where(and(eq(inboundMessages.id, id), eq(inboundMessages.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export const inboxRouter = router({
  /**
   * List replies for the signed-in tenant, newest first, with the lead's
   * company name for display. Optional status/classification filters.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(STATUS_VALUES).optional(),
          classification: z.string().max(32).optional(),
          limit: z.number().min(1).max(100).default(25),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const conditions = [eq(inboundMessages.userId, ctx.user.id)];
      if (input?.status) conditions.push(eq(inboundMessages.status, input.status));
      if (input?.classification)
        conditions.push(eq(inboundMessages.classification, input.classification));

      const where = and(...conditions);

      const rows = await db
        .select({
          id: inboundMessages.id,
          leadId: inboundMessages.leadId,
          campaignId: inboundMessages.campaignId,
          fromEmail: inboundMessages.fromEmail,
          subject: inboundMessages.subject,
          bodyText: inboundMessages.bodyText,
          classification: inboundMessages.classification,
          confidence: inboundMessages.confidence,
          sentiment: inboundMessages.sentiment,
          status: inboundMessages.status,
          createdAt: inboundMessages.createdAt,
          companyName: norwegianCompanies.navn,
          leadStatus: leads.status,
        })
        .from(inboundMessages)
        .leftJoin(leads, eq(inboundMessages.leadId, leads.id))
        .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
        .where(where)
        .orderBy(desc(inboundMessages.createdAt))
        .limit(input?.limit ?? 25)
        .offset(input?.offset ?? 0);

      const [{ total }] = await db
        .select({ total: count() })
        .from(inboundMessages)
        .where(where);

      // Trim the body to a preview for the list view.
      return {
        messages: rows.map((r) => ({
          ...r,
          preview: (r.bodyText ?? "").slice(0, 160),
          bodyText: undefined,
        })),
        total: Number(total),
      };
    }),

  /** Full message + lead context for the detail view (ownership-checked). */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const rows = await db
        .select({
          message: inboundMessages,
          companyName: norwegianCompanies.navn,
          companyEmail: norwegianCompanies.epostadresse,
          leadStatus: leads.status,
          leadEmailSentAt: leads.emailSentAt,
        })
        .from(inboundMessages)
        .leftJoin(leads, eq(inboundMessages.leadId, leads.id))
        .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
        .where(and(eq(inboundMessages.id, input.id), eq(inboundMessages.userId, ctx.user.id)))
        .limit(1);

      if (!rows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Melding ikke funnet" });
      }
      return rows[0];
    }),

  /** Dismiss a reply (no follow-up). */
  markIgnored: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getOwnedMessage(ctx.user.id, input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Melding ikke funnet" });
      const db = await getDb();
      await db
        .update(inboundMessages)
        .set({ status: "ignored", updatedAt: new Date() })
        .where(eq(inboundMessages.id, input.id));
      return { success: true };
    }),

  /** Re-open a dismissed reply. */
  reopen: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getOwnedMessage(ctx.user.id, input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Melding ikke funnet" });
      const db = await getDb();
      await db
        .update(inboundMessages)
        .set({ status: "received", updatedAt: new Date() })
        .where(eq(inboundMessages.id, input.id));
      return { success: true };
    }),

  /**
   * Phase 3 (assisted mode): generate a Norwegian follow-up draft for a reply.
   * The draft is stored on the message (status -> "drafted") and shown to the
   * owner for review — nothing is sent from here.
   */
  generateDraft: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const message = await getOwnedMessage(ctx.user.id, input.id);
      if (!message) throw new TRPCError({ code: "NOT_FOUND", message: "Melding ikke funnet" });
      if (!message.leadId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Meldingen er ikke koblet til en lead" });
      }
      // Guardrail: never draft replies to terminal/negative categories.
      if (message.classification && isTerminalCategory(message.classification as ReplyCategory)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Denne kategorien skal ikke besvares automatisk",
        });
      }

      const database = await getDb();
      const [context] = await database
        .select({
          companyName: norwegianCompanies.navn,
          campaignSubject: campaigns.emailSubject,
          campaignBody: campaigns.emailBody,
          senderName: campaigns.senderName,
        })
        .from(leads)
        .leftJoin(norwegianCompanies, eq(leads.companyId, norwegianCompanies.id))
        .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
        .where(and(eq(leads.id, message.leadId), eq(leads.userId, ctx.user.id)))
        .limit(1);

      const { generateFollowUpDraft } = await import("./services/draftGenerator");
      let draft;
      try {
        draft = await generateFollowUpDraft({
          companyName: context?.companyName ?? "kunden",
          contactEmail: message.fromEmail,
          classification: (message.classification ?? "neutral") as ReplyCategory,
          replyText: message.bodyText ?? "",
          originalSubject: message.subject ?? undefined,
          campaignSubject: context?.campaignSubject ?? undefined,
          campaignBody: context?.campaignBody ?? undefined,
          senderName: context?.senderName ?? ctx.user.name ?? undefined,
        });
      } catch (error) {
        console.error("[Inbox] Draft generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke generere utkast. Sjekk at AI-integrasjonen er konfigurert.",
        });
      }

      await database
        .update(inboundMessages)
        .set({
          draftReply: draft.body,
          draftSubject: draft.subject,
          status: "drafted",
          updatedAt: new Date(),
        })
        .where(eq(inboundMessages.id, input.id));

      return { subject: draft.subject, body: draft.body };
    }),

  /**
   * Phase 3 (assisted mode): send the (possibly owner-edited) follow-up.
   * Guardrails: stopped leads never get mail, terminal categories are refused,
   * and each lead has a hard follow-up cap.
   */
  sendReply: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const message = await getOwnedMessage(ctx.user.id, input.id);
      if (!message) throw new TRPCError({ code: "NOT_FOUND", message: "Melding ikke funnet" });
      if (!message.leadId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Meldingen er ikke koblet til en lead" });
      }
      if (message.classification && isTerminalCategory(message.classification as ReplyCategory)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Denne kategorien skal ikke besvares",
        });
      }

      const database = await getDb();
      const [lead] = await database
        .select()
        .from(leads)
        .where(and(eq(leads.id, message.leadId), eq(leads.userId, ctx.user.id)))
        .limit(1);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead ikke funnet" });

      // Guardrail 1: stopped leads never receive follow-ups.
      if (lead.unsubscribed || STOPPED_LEAD_STATUSES.has(lead.status)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Denne leaden har meldt seg av eller er stoppet",
        });
      }
      // Guardrail 2: hard per-lead follow-up cap.
      if (lead.followUpCount >= MAX_FOLLOWUPS_PER_LEAD) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Maks ${MAX_FOLLOWUPS_PER_LEAD} oppfølginger per lead er nådd`,
        });
      }

      // Build tracked HTML (tracking pixel + unsubscribe footer) like campaign sends.
      const htmlBody = `<html><body>${input.body
        .split(/\n{2,}/)
        .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("")}</body></html>`;
      const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
      const { prepareEmailWithTracking } = await import("./emailTracking");
      const trackedHtml = lead.trackingId
        ? prepareEmailWithTracking(htmlBody, lead.trackingId, baseUrl)
        : htmlBody;

      const { sendEmail } = await import("./emailService");
      const result = await sendEmail({
        to: message.fromEmail,
        subject: input.subject,
        html: trackedHtml,
        text: input.body,
        trackingId: lead.trackingId ?? undefined,
        campaignId: message.campaignId ?? undefined,
        // Signed Reply-To again, so the next reply also routes back here.
        userId: ctx.user.id,
        leadId: lead.id,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Sending feilet: ${result.error ?? "ukjent feil"}`,
        });
      }

      const now = new Date();
      await database
        .update(inboundMessages)
        .set({ status: "replied", updatedAt: now })
        .where(eq(inboundMessages.id, input.id));
      await database
        .update(leads)
        .set({
          followUpCount: lead.followUpCount + 1,
          lastFollowUpAt: now,
          updatedAt: now,
        })
        .where(eq(leads.id, lead.id));

      try {
        await db.createNotification({
          userId: ctx.user.id,
          type: "followup_sent",
          title: "Oppfølging sendt",
          message: `Til ${message.fromEmail}: ${input.subject}`,
          relatedId: lead.id,
          relatedType: "lead",
        });
      } catch (err) {
        console.error("[Inbox] followup notification failed:", err);
      }

      return { success: true, messageId: result.messageId };
    }),

  /** Counts for badges/filters: by status and by classification. */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const byStatus = await db
      .select({ status: inboundMessages.status, count: count() })
      .from(inboundMessages)
      .where(eq(inboundMessages.userId, ctx.user.id))
      .groupBy(inboundMessages.status);
    const byClassification = await db
      .select({ classification: inboundMessages.classification, count: count() })
      .from(inboundMessages)
      .where(eq(inboundMessages.userId, ctx.user.id))
      .groupBy(inboundMessages.classification);

    return {
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, Number(r.count)])),
      byClassification: Object.fromEntries(
        byClassification.filter((r) => r.classification).map((r) => [r.classification, Number(r.count)])
      ),
      total: byStatus.reduce((acc, r) => acc + Number(r.count), 0),
    };
  }),
});
