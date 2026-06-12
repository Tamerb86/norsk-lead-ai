import { describe, expect, it, beforeAll } from "vitest";
import { getDb } from "./db";
import * as db from "./db";
import { campaigns, leads, inboundMessages, norwegianCompanies } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ingestInboundEmail } from "./services/inboundAgent";
import { buildReplyAddress } from "./services/replyAddress";

const USER_ID = 1;

async function makeLead(): Promise<{ leadId: number; campaignId: number }> {
  const database = await getDb();
  // A company is required (leads.companyId is NOT NULL).
  const [company] = await database
    .insert(norwegianCompanies)
    .values({
      organisasjonsnummer: `${900000000 + Math.floor((Date.now() % 1_000_000))}`,
      navn: "Inbound Test AS",
    })
    .returning({ id: norwegianCompanies.id });

  const campaign = await db.createCampaign({ userId: USER_ID, name: "Inbound Test Campaign" });
  const lead = await db.createLead({
    userId: USER_ID,
    campaignId: campaign.id,
    companyId: company.id,
    email: "lead@kunde.no",
  });
  return { leadId: lead.id, campaignId: campaign.id };
}

describe("ingestInboundEmail", () => {
  beforeAll(async () => {
    // Ensure the test tenant exists (CI seeds it; be defensive locally).
    const database = await getDb();
    await database.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import("drizzle-orm")).sql`INSERT INTO users (id, "openId", name, email, role)
        VALUES (1, 'test-user', 'Test User', 'test@example.com', 'user')
        ON CONFLICT (id) DO NOTHING`
    );
  });

  it("matches a signed reply, classifies it, stores it, and notifies", async () => {
    const { leadId } = await makeLead();
    const result = await ingestInboundEmail({
      from: "lead@kunde.no",
      to: buildReplyAddress(USER_ID, leadId),
      subject: "Re: Tilbud",
      text: "Ja, dette høres interessant ut. Fortell meg mer!",
      messageId: `<msg-${Date.now()}-a@kunde.no>`,
    });

    expect(result.stored).toBe(true);
    expect(result.matched).toBe(true);
    expect(result.matchMethod).toBe("signed_address");
    expect(result.category).toBe("interested");
    expect(result.leadStopped).toBe(false);

    const stored = await (await getDb())
      .select()
      .from(inboundMessages)
      .where(eq(inboundMessages.id, result.inboundMessageId!))
      .limit(1);
    expect(stored[0].userId).toBe(USER_ID);
    expect(stored[0].leadId).toBe(leadId);
    expect(stored[0].status).toBe("received");

    // The owner gets a tenant-scoped notification.
    const notifs = await (await getDb()).execute(
      (await import("drizzle-orm")).sql`SELECT type FROM notifications WHERE user_id = ${USER_ID} AND "relatedId" = ${leadId}`
    );
    expect(notifs.rows.length).toBeGreaterThan(0);
  });

  it("stops the lead on an unsubscribe reply (guardrail)", async () => {
    const { leadId } = await makeLead();
    const result = await ingestInboundEmail({
      from: "lead@kunde.no",
      to: buildReplyAddress(USER_ID, leadId),
      text: "Vennligst fjern meg fra listen.",
      messageId: `<msg-${Date.now()}-b@kunde.no>`,
    });

    expect(result.category).toBe("unsubscribe");
    expect(result.leadStopped).toBe(true);

    const updated = await (await getDb()).select().from(leads).where(eq(leads.id, leadId)).limit(1);
    expect(updated[0].status).toBe("unsubscribed");
    expect(updated[0].unsubscribed).toBe(true);

    // The stored inbound row is marked "ignored" — no automated reply will fire.
    const stored = await (await getDb())
      .select()
      .from(inboundMessages)
      .where(eq(inboundMessages.id, result.inboundMessageId!))
      .limit(1);
    expect(stored[0].status).toBe("ignored");
  });

  it("drops a reply with a forged tag (no tenant match, nothing stored)", async () => {
    const { leadId } = await makeLead();
    const validAddr = buildReplyAddress(USER_ID, leadId);
    // Keep the token but change the lead id -> HMAC fails -> no match.
    const forged = validAddr.replace(`-${leadId}-`, `-${leadId + 1}-`);
    const result = await ingestInboundEmail({
      from: "attacker@evil.no",
      to: forged,
      text: "Ja, gjerne!",
      messageId: `<msg-${Date.now()}-c@evil.no>`,
    });

    expect(result.stored).toBe(false);
    expect(result.matched).toBe(false);
    expect(result.reason).toBe("no_tenant_match");
  });

  it("is idempotent on Message-ID (no double store)", async () => {
    const { leadId } = await makeLead();
    const msgId = `<msg-${Date.now()}-d@kunde.no>`;
    const email = {
      from: "lead@kunde.no",
      to: buildReplyAddress(USER_ID, leadId),
      text: "Hva koster dette?",
      messageId: msgId,
    };
    const first = await ingestInboundEmail(email);
    const second = await ingestInboundEmail(email);
    expect(first.stored).toBe(true);
    expect(second.stored).toBe(false);
    expect(second.reason).toBe("duplicate");
  });
});
