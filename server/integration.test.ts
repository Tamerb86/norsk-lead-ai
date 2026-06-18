import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Integration tests for complete user workflows
 * These tests verify that multiple API calls work together correctly
 */

function createAuthContext(
  role: "admin" | "user" = "user",
  userId: number = 1
): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `integration-test-user-${userId}`,
    email: `integration${userId}@example.com`,
    name: `Integration Test User ${userId}`,
    loginMethod: "local",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "http://localhost:3000" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Campaign Workflow Integration", () => {
  const ctx = createAuthContext("user", 2001);
  const caller = appRouter.createCaller(ctx);
  let campaignId: number;

  it("creates a campaign", async () => {
    const result = await caller.campaigns.create({
      name: "Integration Test Campaign",
      emailSubject: "Test Subject",
      emailBody: "Hello {{company_name}}, this is a test.",
      senderName: "Test Sender",
      senderEmail: "sender@test.com",
    });

    expect(result.id).toBeDefined();
    campaignId = result.id;
  });

  it("retrieves the created campaign", async () => {
    const result = await caller.campaigns.getById({ id: campaignId });

    expect(result).toBeDefined();
    expect(result?.name).toBe("Integration Test Campaign");
  });

  it("lists campaigns including the new one", async () => {
    const result = await caller.campaigns.list();

    expect(Array.isArray(result)).toBe(true);
    const found = result.find((c) => c.id === campaignId);
    expect(found).toBeDefined();
  });

  it("creates an A/B test for the campaign", async () => {
    const result = await caller.abTesting.create({
      campaignId,
      name: "Subject Line A/B Test",
      testType: "subject",
      variantA: { subject: "Subject A - Direct" },
      variantB: { subject: "Subject B - Question?" },
      sampleSize: 20,
      winningCriteria: "open_rate",
      autoSelectWinner: false,
      testDurationHours: 24,
    });

    expect(result.id).toBeDefined();
  });

  it("deletes the campaign", async () => {
    const result = await caller.campaigns.delete({ id: campaignId });
    expect(result.success).toBe(true);

    // Verify deletion
    const deleted = await caller.campaigns.getById({ id: campaignId });
    expect(deleted).toBeNull();
  });
});

describe("Template Workflow Integration", () => {
  const ctx = createAuthContext("user", 2002);
  const caller = appRouter.createCaller(ctx);
  let templateId: number;

  it("creates a template", async () => {
    const result = await caller.templates.create({
      name: "Integration Test Template",
      subject: "Welcome to {{company_name}}",
      body: "Dear {{contact_name}},\n\nWelcome to our service.\n\nBest regards",
      category: "welcome",
    });

    expect(result.id).toBeDefined();
    templateId = result.id;
  });

  it("lists templates including the new one", async () => {
    const result = await caller.templates.list();

    expect(Array.isArray(result)).toBe(true);
    const found = result.find((t) => t.id === templateId);
    expect(found).toBeDefined();
  });

  it("updates the template", async () => {
    const result = await caller.templates.update({
      id: templateId,
      name: "Updated Integration Template",
      subject: "Updated Subject",
    });

    expect(result.id).toBe(templateId);
    expect(result.name).toBe("Updated Integration Template");
  });

  it("uses template in campaign creation", async () => {
    // Get template details
    const templates = await caller.templates.list();
    const template = templates.find((t) => t.id === templateId);

    expect(template).toBeDefined();

    // Create campaign using template content
    const campaign = await caller.campaigns.create({
      name: "Campaign from Template",
      emailSubject: template!.subject,
      emailBody: template!.body,
      senderName: "Template Sender",
      senderEmail: "template@test.com",
    });

    expect(campaign.id).toBeDefined();

    // Cleanup
    await caller.campaigns.delete({ id: campaign.id });
  });

  it("deletes the template", async () => {
    const result = await caller.templates.delete({ id: templateId });
    expect(result.success).toBe(true);
  });
});

describe("Lead Scoring Workflow Integration", () => {
  const ctx = createAuthContext("user", 2003);
  const caller = appRouter.createCaller(ctx);
  let ruleId: number;

  it("creates scoring rules", async () => {
    // Create engagement rule
    const engagementRule = await caller.leadScoringAdvanced.createRule({
      name: "Email Opened",
      ruleType: "engagement",
      condition: { event: "email_opened" },
      scoreChange: 10,
      isActive: true,
    });
    expect(engagementRule.id).toBeDefined();
    ruleId = engagementRule.id;

    // Create company attribute rule
    const companyRule = await caller.leadScoringAdvanced.createRule({
      name: "Large Company",
      ruleType: "company_attribute",
      condition: { employees: { min: 100 } },
      scoreChange: 15,
      isActive: true,
    });
    expect(companyRule.id).toBeDefined();
  });

  it("lists all rules", async () => {
    const rules = await caller.leadScoringAdvanced.getRules();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(2);
  });

  it("gets leads by tier", async () => {
    const result = await caller.leadScoringAdvanced.getLeadsByTier({});

    expect(result).toHaveProperty("leads");
    expect(result).toHaveProperty("stats");
  });

  it("recalculates scores", async () => {
    const result = await caller.leadScoringAdvanced.recalculateScores();

    expect(result).toHaveProperty("updated");
    expect(typeof result.updated).toBe("number");
  });

  it("cleans up rules", async () => {
    const result = await caller.leadScoringAdvanced.deleteRule({
      ruleId,
    });
    expect(result.success).toBe(true);
  });
});

describe("Webhook Workflow Integration", () => {
  const ctx = createAuthContext("user", 2004);
  const caller = appRouter.createCaller(ctx);
  let webhookId: number;

  it("creates a webhook", async () => {
    const result = await caller.webhooks.create({
      name: "Integration Test Webhook",
      url: "https://httpbin.org/post",
      secret: "integration-test-secret",
      events: ["lead.created", "lead.updated", "campaign.sent"],
    });

    expect(result.id).toBeDefined();
    webhookId = result.id;
  });

  it("lists webhooks", async () => {
    const result = await caller.webhooks.list();

    expect(Array.isArray(result)).toBe(true);
    const found = result.find((w) => w.id === webhookId);
    expect(found).toBeDefined();
    expect(found?.events).toContain("lead.created");
  });

  it("updates webhook status", async () => {
    // Deactivate
    await caller.webhooks.update({
      webhookId,
      isActive: false,
    });

    // Verify
    const webhooks = await caller.webhooks.list();
    const webhook = webhooks.find((w) => w.id === webhookId);
    expect(webhook?.isActive).toBe(false);

    // Reactivate
    await caller.webhooks.update({
      webhookId,
      isActive: true,
    });
  });

  it("gets delivery history", async () => {
    const result = await caller.webhooks.getDeliveries({
      webhookId,
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("deletes webhook", async () => {
    const result = await caller.webhooks.delete({ webhookId });
    expect(result.success).toBe(true);
  });
});

describe("Referral System Integration", () => {
  const referrerCtx = createAuthContext("user", 2005);
  const referrerCaller = appRouter.createCaller(referrerCtx);

  it("gets referral stats and code", async () => {
    const stats = await referrerCaller.referral.getMyStats();

    expect(stats.referralCode).toBeTruthy();
    expect(stats.totalInvited).toBeGreaterThanOrEqual(0);
  });

  it("validates referral code", async () => {
    const stats = await referrerCaller.referral.getMyStats();

    // Validate using unauthenticated context (public endpoint)
    const unauthCtx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const unauthCaller = appRouter.createCaller(unauthCtx);

    const validation = await unauthCaller.referral.validateCode({
      code: stats.referralCode,
    });

    expect(validation.valid).toBe(true);
  });

  it("sends invite and tracks it", async () => {
    // Send invite
    const inviteResult = await referrerCaller.referral.sendInvite({
      email: "newreferral@example.com",
      name: "New Referral",
    });
    expect(inviteResult.success).toBe(true);

    // Check referrals list
    const referrals = await referrerCaller.referral.getMyReferrals();
    expect(Array.isArray(referrals)).toBe(true);
  });
});

describe("Dashboard Integration", () => {
  const ctx = createAuthContext("user", 2006);
  const caller = appRouter.createCaller(ctx);

  it("gets dashboard stats", async () => {
    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("totalCampaigns");
    expect(stats).toHaveProperty("totalLeads");
    expect(stats).toHaveProperty("totalEmails");
  });

  it("gets recent campaigns", async () => {
    const campaigns = await caller.dashboard.recentCampaigns();

    expect(Array.isArray(campaigns)).toBe(true);
  });

  it("gets top leads", async () => {
    const leads = await caller.dashboard.topLeads();

    expect(Array.isArray(leads)).toBe(true);
  });
});

describe("Cross-Feature Integration", () => {
  const ctx = createAuthContext("user", 2007);
  const caller = appRouter.createCaller(ctx);

  it("complete campaign workflow with A/B test and leads", async () => {
    // 1. Create campaign
    const campaign = await caller.campaigns.create({
      name: "Full Integration Campaign",
      emailSubject: "Test Subject",
      emailBody: "Test body",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    // 2. Create A/B test
    const abTest = await caller.abTesting.create({
      campaignId: campaign.id,
      name: "Full Integration A/B",
      testType: "subject",
      variantA: { subject: "A" },
      variantB: { subject: "B" },
      sampleSize: 20,
      winningCriteria: "open_rate",
      autoSelectWinner: false,
      testDurationHours: 24,
    });

    // 3. Verify A/B test is linked to campaign
    const abTestDetails = await caller.abTesting.getById({ id: abTest.id });
    expect(abTestDetails?.campaignId).toBe(campaign.id);

    // 4. Create webhook for campaign events
    const webhook = await caller.webhooks.create({
      name: "Campaign Webhook",
      url: "https://httpbin.org/post",
      events: ["campaign.sent", "email.opened"],
    });

    // 5. Verify all components exist
    expect(campaign.id).toBeDefined();
    expect(abTest.id).toBeDefined();
    expect(webhook.id).toBeDefined();

    // Cleanup
    await caller.webhooks.delete({ webhookId: webhook.id });
    await caller.campaigns.delete({ id: campaign.id });
  });
});
