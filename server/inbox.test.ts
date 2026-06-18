import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import * as db from "./db";
import { norwegianCompanies } from "../drizzle/schema";
import { ingestInboundEmail } from "./services/inboundAgent";
import { buildReplyAddress } from "./services/replyAddress";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function seedInboundMessage(text: string): Promise<{ leadId: number; messageId: number }> {
  const d = await getDb();
  const [company] = await d
    .insert(norwegianCompanies)
    .values({
      organisasjonsnummer: `${920000000 + Math.floor(Date.now() % 1_000_000)}`,
      navn: "Innboks Test AS",
    })
    .returning({ id: norwegianCompanies.id });
  const campaign = await db.createCampaign({ userId: 1, name: "Innboks Test" });
  const lead = await db.createLead({ userId: 1, campaignId: campaign.id, companyId: company.id });
  const result = await ingestInboundEmail({
    from: "lead@kunde.no",
    to: buildReplyAddress(1, lead.id),
    subject: "Re: Tilbud",
    text,
    messageId: `<inbox-test-${Date.now()}-${Math.random()}@kunde.no>`,
  });
  return { leadId: lead.id, messageId: result.inboundMessageId! };
}

describe("inbox.list", () => {
  it("returns the tenant's replies with company name and preview", async () => {
    const { messageId } = await seedInboundMessage("Ja, dette høres interessant ut!");
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.inbox.list({ limit: 50 });

    expect(result.total).toBeGreaterThan(0);
    const mine = result.messages.find((m) => m.id === messageId);
    expect(mine).toBeDefined();
    expect(mine!.companyName).toBe("Innboks Test AS");
    expect(mine!.classification).toBe("interested");
    expect(mine!.preview).toContain("interessant");
  });

  it("filters by classification", async () => {
    await seedInboundMessage("Hva koster dette? Send prisliste.");
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.inbox.list({ classification: "pricing", limit: 50 });
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages.every((m) => m.classification === "pricing")).toBe(true);
  });

  it("does not leak another tenant's messages", async () => {
    await seedInboundMessage("Fortell meg mer!");
    const otherTenant = appRouter.createCaller(createAuthContext(424242));
    const result = await otherTenant.inbox.list({ limit: 100 });
    expect(result.total).toBe(0);
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.inbox.list()).rejects.toThrow();
  });
});

describe("inbox.get", () => {
  it("returns full message with lead context", async () => {
    const { messageId, leadId } = await seedInboundMessage("La oss avtale et møte neste uke.");
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.inbox.get({ id: messageId });
    expect(result.message.leadId).toBe(leadId);
    expect(result.message.classification).toBe("meeting_request");
    expect(result.companyName).toBe("Innboks Test AS");
  });

  it("rejects access to another tenant's message", async () => {
    const { messageId } = await seedInboundMessage("Interessant!");
    const otherTenant = appRouter.createCaller(createAuthContext(424242));
    await expect(otherTenant.inbox.get({ id: messageId })).rejects.toThrow();
  });
});

describe("inbox.markIgnored / reopen", () => {
  it("dismisses and re-opens a reply", async () => {
    const { messageId } = await seedInboundMessage("Fortell meg mer om produktet.");
    const caller = appRouter.createCaller(createAuthContext());

    await caller.inbox.markIgnored({ id: messageId });
    let msg = await caller.inbox.get({ id: messageId });
    expect(msg.message.status).toBe("ignored");

    await caller.inbox.reopen({ id: messageId });
    msg = await caller.inbox.get({ id: messageId });
    expect(msg.message.status).toBe("received");
  });

  it("rejects mutating another tenant's message", async () => {
    const { messageId } = await seedInboundMessage("Ja takk!");
    const otherTenant = appRouter.createCaller(createAuthContext(424242));
    await expect(otherTenant.inbox.markIgnored({ id: messageId })).rejects.toThrow();
  });
});

describe("inbox.stats", () => {
  it("returns per-status and per-classification counts", async () => {
    await seedInboundMessage("Høres bra ut, fortell mer!");
    const caller = appRouter.createCaller(createAuthContext());
    const stats = await caller.inbox.stats();
    expect(stats.total).toBeGreaterThan(0);
    expect(Object.keys(stats.byStatus).length).toBeGreaterThan(0);
    expect(stats.byClassification.interested ?? 0).toBeGreaterThan(0);
  });
});
