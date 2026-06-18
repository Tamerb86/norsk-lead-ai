import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("abTesting.list", () => {
  it("returns list of A/B tests for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.abTesting.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.abTesting.list()).rejects.toThrow();
  });
});

describe("abTesting.create", () => {
  it("creates a new A/B test with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a campaign
    const campaign = await caller.campaigns.create({
      name: "Test Campaign for A/B",
      emailSubject: "Test Subject",
      emailBody: "Test body",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    const result = await caller.abTesting.create({
      campaignId: campaign.id,
      name: "Subject Line Test",
      testType: "subject",
      variantA: { subject: "Subject A" },
      variantB: { subject: "Subject B" },
      sampleSize: 20,
      winningCriteria: "open_rate",
      autoSelectWinner: true,
      testDurationHours: 24,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.abTesting.create({
        campaignId: 1,
        name: "Test",
        testType: "subject",
        variantA: { subject: "A" },
        variantB: { subject: "B" },
        sampleSize: 20,
        winningCriteria: "open_rate",
        autoSelectWinner: true,
        testDurationHours: 24,
      })
    ).rejects.toThrow();
  });

  it("validates sample size range", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Sample size too low
    await expect(
      caller.abTesting.create({
        campaignId: 1,
        name: "Test",
        testType: "subject",
        variantA: { subject: "A" },
        variantB: { subject: "B" },
        sampleSize: 2, // Below minimum of 5
        winningCriteria: "open_rate",
        autoSelectWinner: true,
        testDurationHours: 24,
      })
    ).rejects.toThrow();

    // Sample size too high
    await expect(
      caller.abTesting.create({
        campaignId: 1,
        name: "Test",
        testType: "subject",
        variantA: { subject: "A" },
        variantB: { subject: "B" },
        sampleSize: 60, // Above maximum of 50
        winningCriteria: "open_rate",
        autoSelectWinner: true,
        testDurationHours: 24,
      })
    ).rejects.toThrow();
  });

  it("validates test type enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.abTesting.create({
        campaignId: 1,
        name: "Test",
        testType: "invalid_type" as any,
        variantA: { subject: "A" },
        variantB: { subject: "B" },
        sampleSize: 20,
        winningCriteria: "open_rate",
        autoSelectWinner: true,
        testDurationHours: 24,
      })
    ).rejects.toThrow();
  });
});

describe("abTesting.getById", () => {
  it("returns A/B test details for valid ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a campaign and A/B test
    const campaign = await caller.campaigns.create({
      name: "Test Campaign",
      emailSubject: "Test",
      emailBody: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    const created = await caller.abTesting.create({
      campaignId: campaign.id,
      name: "Test A/B",
      testType: "subject",
      variantA: { subject: "A" },
      variantB: { subject: "B" },
      sampleSize: 20,
      winningCriteria: "open_rate",
      autoSelectWinner: true,
      testDurationHours: 24,
    });

    const result = await caller.abTesting.getById({ id: created.id });

    expect(result).toBeDefined();
    if (result) {
      expect(result.id).toBe(created.id);
      expect(result.name).toBe("Test A/B");
    }
  });

  it("returns null for non-existent A/B test", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.abTesting.getById({ id: 999999 });
    expect(result).toBeNull();
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.abTesting.getById({ id: 1 })).rejects.toThrow();
  });
});

describe("abTesting.selectWinner", () => {
  it("selects winner for A/B test", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create campaign and A/B test
    const campaign = await caller.campaigns.create({
      name: "Winner Test Campaign",
      emailSubject: "Test",
      emailBody: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    const abTest = await caller.abTesting.create({
      campaignId: campaign.id,
      name: "Winner Selection Test",
      testType: "subject",
      variantA: { subject: "A" },
      variantB: { subject: "B" },
      sampleSize: 20,
      winningCriteria: "open_rate",
      autoSelectWinner: false,
      testDurationHours: 24,
    });

    const result = await caller.abTesting.selectWinner({
      testId: abTest.id,
      winner: "A",
    });

    expect(result.success).toBe(true);
  });

  it("validates winner value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.abTesting.selectWinner({
        testId: 1,
        winner: "C" as any, // Invalid winner
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.abTesting.selectWinner({
        testId: 1,
        winner: "A",
      })
    ).rejects.toThrow();
  });
});
