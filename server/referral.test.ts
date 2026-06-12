import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(
  role: "admin" | "user" = "user",
  userId: number = 1
): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("referral.getMyStats", () => {
  it("returns referral statistics for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.referral.getMyStats();

    expect(result).toHaveProperty("referralCode");
    expect(result).toHaveProperty("totalInvited");
    expect(result).toHaveProperty("totalSignedUp");
    expect(result).toHaveProperty("totalConverted");
    expect(result).toHaveProperty("totalRewards");
    expect(typeof result.referralCode).toBe("string");
    expect(typeof result.totalInvited).toBe("number");
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.referral.getMyStats()).rejects.toThrow();
  });
});

describe("referral.getMyReferrals", () => {
  it("returns list of referrals for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.referral.getMyReferrals();

    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.referral.getMyReferrals()).rejects.toThrow();
  });
});

describe("referral.sendInvite", () => {
  it("sends an invitation email", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.referral.sendInvite({
      email: "newuser@example.com",
      name: "New User",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("validates email format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.referral.sendInvite({
        email: "invalid-email",
        name: "Test",
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.referral.sendInvite({
        email: "test@example.com",
        name: "Test",
      })
    ).rejects.toThrow();
  });
});

describe("referral.validateCode", () => {
  it("validates a valid referral code", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get the user's referral code
    const stats = await caller.referral.getMyStats();

    // Validate the code (can be done without auth)
    const unauthCaller = appRouter.createCaller(createUnauthContext());
    const result = await unauthCaller.referral.validateCode({
      code: stats.referralCode,
    });

    expect(result).toHaveProperty("valid");
    expect(result.valid).toBe(true);
    expect(result).toHaveProperty("referrerName");
  });

  it("returns invalid for non-existent code", async () => {
    const caller = appRouter.createCaller(createUnauthContext());

    const result = await caller.referral.validateCode({
      code: "INVALID-CODE-12345",
    });

    expect(result.valid).toBe(false);
  });

  it("is accessible without authentication (public endpoint)", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw, even without auth
    const result = await caller.referral.validateCode({
      code: "ANY-CODE",
    });

    expect(result).toHaveProperty("valid");
  });
});

describe("referral.claimReward", () => {
  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.referral.claimReward({ referralId: 1 })
    ).rejects.toThrow();
  });

  it("validates referral ownership", async () => {
    const ctx = createAuthContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    // Try to claim a referral that doesn't exist or doesn't belong to user
    await expect(
      caller.referral.claimReward({ referralId: 999999 })
    ).rejects.toThrow();
  });
});

describe("referral integration", () => {
  it("creates referral stats on first access", async () => {
    // Use a unique user ID to simulate a new user (kept within int32 range —
    // user ids are serial integers in Postgres)
    const ctx = createAuthContext("user", 10_000 + (Date.now() % 1_000_000_000));
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.referral.getMyStats();

    // New user should have zero stats but a valid referral code
    expect(stats.referralCode).toBeTruthy();
    expect(stats.referralCode.length).toBeGreaterThan(0);
    expect(stats.totalInvited).toBe(0);
    expect(stats.totalSignedUp).toBe(0);
    expect(stats.totalConverted).toBe(0);
    expect(stats.totalRewards).toBe(0);
  });

  it("referral code is unique per user", async () => {
    const ctx1 = createAuthContext("user", 1001);
    const ctx2 = createAuthContext("user", 1002);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const stats1 = await caller1.referral.getMyStats();
    const stats2 = await caller2.referral.getMyStats();

    expect(stats1.referralCode).not.toBe(stats2.referralCode);
  });
});
