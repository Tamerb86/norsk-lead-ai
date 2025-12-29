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
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.manusvm.computer" },
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

describe("leadScoringAdvanced.getLeadsByTier", () => {
  it("returns leads grouped by tier", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadScoringAdvanced.getLeadsByTier({});

    expect(result).toHaveProperty("leads");
    expect(result).toHaveProperty("stats");
    expect(Array.isArray(result.leads)).toBe(true);
  });

  it("filters by specific tier", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadScoringAdvanced.getLeadsByTier({
      tier: "hot",
    });

    expect(Array.isArray(result.leads)).toBe(true);
    // All leads should be in the 'hot' tier
    result.leads.forEach((lead: any) => {
      expect(lead.tier).toBe("hot");
    });
  });

  it("validates tier enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.getLeadsByTier({
        tier: "invalid_tier" as any,
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.getLeadsByTier({})
    ).rejects.toThrow();
  });
});

describe("leadScoringAdvanced.getRules", () => {
  it("returns list of scoring rules", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadScoringAdvanced.getRules();

    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.leadScoringAdvanced.getRules()).rejects.toThrow();
  });
});

describe("leadScoringAdvanced.createRule", () => {
  it("creates a new scoring rule with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadScoringAdvanced.createRule({
      name: "Email Opened",
      ruleType: "engagement",
      condition: { event: "email_opened" },
      scoreChange: 10,
      isActive: true,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("validates rule type enum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.createRule({
        name: "Invalid Rule",
        ruleType: "invalid_type" as any,
        condition: { event: "test" },
        scoreChange: 10,
        isActive: true,
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.createRule({
        name: "Test Rule",
        ruleType: "engagement",
        condition: { event: "test" },
        scoreChange: 10,
        isActive: true,
      })
    ).rejects.toThrow();
  });
});

describe("leadScoringAdvanced.updateRule", () => {
  it("updates an existing rule", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a rule first
    const created = await caller.leadScoringAdvanced.createRule({
      name: "Original Rule",
      ruleType: "engagement",
      condition: { event: "email_opened" },
      scoreChange: 10,
      isActive: true,
    });

    // Update it
    const result = await caller.leadScoringAdvanced.updateRule({
      ruleId: created.id,
      name: "Updated Rule",
      scoreChange: 20,
    });

    expect(result.success).toBe(true);
  });

  it("toggles rule active status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a rule
    const created = await caller.leadScoringAdvanced.createRule({
      name: "Toggle Test",
      ruleType: "engagement",
      condition: { event: "test" },
      scoreChange: 5,
      isActive: true,
    });

    // Deactivate it
    const result = await caller.leadScoringAdvanced.updateRule({
      ruleId: created.id,
      isActive: false,
    });

    expect(result.success).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.updateRule({
        ruleId: 1,
        name: "Updated",
      })
    ).rejects.toThrow();
  });
});

describe("leadScoringAdvanced.deleteRule", () => {
  it("deletes a rule successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a rule
    const created = await caller.leadScoringAdvanced.createRule({
      name: "To Delete",
      ruleType: "engagement",
      condition: { event: "test" },
      scoreChange: 5,
      isActive: true,
    });

    // Delete it
    const result = await caller.leadScoringAdvanced.deleteRule({
      ruleId: created.id,
    });

    expect(result.success).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.deleteRule({ ruleId: 1 })
    ).rejects.toThrow();
  });
});

describe("leadScoringAdvanced.recalculateScores", () => {
  it("recalculates all lead scores", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leadScoringAdvanced.recalculateScores();

    expect(result).toHaveProperty("updated");
    expect(typeof result.updated).toBe("number");
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leadScoringAdvanced.recalculateScores()
    ).rejects.toThrow();
  });
});
