/**
 * Phase 3 guardrail tests for inbox.generateDraft / inbox.sendReply.
 * The LLM and SendGrid are NOT configured in tests — so the happy send path
 * fails at the provider boundary, which is itself asserted. What we verify
 * hard here is that every guardrail REFUSES before any external call.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import * as db from "./db";
import { norwegianCompanies, leads, inboundMessages } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ingestInboundEmail } from "./services/inboundAgent";
import { buildReplyAddress } from "./services/replyAddress";

function createAuthContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: "test@example.com",
      name: "Test User",
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as TrpcContext["res"],
  };
}

async function seedReply(text: string): Promise<{ leadId: number; messageId: number }> {
  const d = await getDb();
  const [company] = await d
    .insert(norwegianCompanies)
    .values({
      organisasjonsnummer: `${930000000 + Math.floor(Date.now() % 1_000_000)}`,
      navn: "Send Test AS",
    })
    .returning({ id: norwegianCompanies.id });
  const campaign = await db.createCampaign({ userId: 1, name: "Send Test" });
  const lead = await db.createLead({ userId: 1, campaignId: campaign.id, companyId: company.id });
  const result = await ingestInboundEmail({
    from: "lead@kunde.no",
    to: buildReplyAddress(1, lead.id),
    text,
    messageId: `<send-test-${Date.now()}-${Math.random()}@kunde.no>`,
  });
  return { leadId: lead.id, messageId: result.inboundMessageId! };
}

describe("inbox.generateDraft guardrails", () => {
  it("refuses to draft for terminal categories (not_interested)", async () => {
    const { messageId } = await seedReply("Nei takk, ikke interessert.");
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.inbox.generateDraft({ id: messageId })).rejects.toThrow(
      /skal ikke besvares/
    );
  });

  it("rejects another tenant's message", async () => {
    const { messageId } = await seedReply("Fortell meg mer!");
    const otherTenant = appRouter.createCaller(createAuthContext(424242));
    await expect(otherTenant.inbox.generateDraft({ id: messageId })).rejects.toThrow();
  });

  it("fails cleanly when the LLM is not configured (no partial state)", async () => {
    const { messageId } = await seedReply("Dette høres interessant ut!");
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.inbox.generateDraft({ id: messageId })).rejects.toThrow(
      /Kunne ikke generere utkast/
    );
    // Status must remain "received" — no half-written draft state.
    const msg = await caller.inbox.get({ id: messageId });
    expect(msg.message.status).toBe("received");
    expect(msg.message.draftReply).toBeNull();
  });
});

describe("inbox.sendReply guardrails", () => {
  it("refuses terminal categories", async () => {
    const { messageId } = await seedReply("Vennligst fjern meg fra listen.");
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.inbox.sendReply({ id: messageId, subject: "Hei", body: "Takk for svaret." })
    ).rejects.toThrow(/skal ikke besvares/);
  });

  it("refuses when the lead has been stopped after the message arrived", async () => {
    const { messageId, leadId } = await seedReply("Interessant!");
    const d = await getDb();
    await d.update(leads).set({ status: "unsubscribed", unsubscribed: true }).where(eq(leads.id, leadId));

    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.inbox.sendReply({ id: messageId, subject: "Hei", body: "Oppfølging." })
    ).rejects.toThrow(/meldt seg av|stoppet/);
  });

  it("enforces the per-lead follow-up cap", async () => {
    const { messageId, leadId } = await seedReply("Ja, gjerne mer info!");
    const d = await getDb();
    await d.update(leads).set({ followUpCount: 5 }).where(eq(leads.id, leadId));

    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.inbox.sendReply({ id: messageId, subject: "Hei", body: "Oppfølging." })
    ).rejects.toThrow(/Maks 5 oppfølginger/);
  });

  it("rejects another tenant's message", async () => {
    const { messageId } = await seedReply("Høres bra ut!");
    const otherTenant = appRouter.createCaller(createAuthContext(424242));
    await expect(
      otherTenant.inbox.sendReply({ id: messageId, subject: "x", body: "y" })
    ).rejects.toThrow();
  });

  it("passes all guardrails then fails only at the unconfigured provider, with no state change", async () => {
    const { messageId } = await seedReply("Kan vi ta en prat om dette?");
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.inbox.sendReply({ id: messageId, subject: "Oppfølging", body: "Takk for svaret!" })
    ).rejects.toThrow(/Sending feilet/);
    // Nothing was marked replied since the send failed.
    const msg = await caller.inbox.get({ id: messageId });
    expect(msg.message.status).toBe("received");
  });
});
