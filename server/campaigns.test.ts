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

describe("campaigns.create", () => {
  it("creates a new campaign with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaigns.create({
      name: "Test Campaign",
      emailSubject: "Test Subject",
      emailBody: "Test email body",
      senderName: "Test Sender",
      senderEmail: "sender@test.com",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.campaigns.create({
        name: "Test Campaign",
        emailSubject: "Test Subject",
        emailBody: "Test body",
        senderName: "Test",
        senderEmail: "test@test.com",
      })
    ).rejects.toThrow();
  });

  it("validates required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.campaigns.create({
        name: "",
        emailSubject: "Test",
        emailBody: "Test",
        senderName: "Test",
        senderEmail: "test@test.com",
      })
    ).rejects.toThrow();
  });

  it("validates email format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.campaigns.create({
        name: "Test",
        emailSubject: "Test",
        emailBody: "Test",
        senderName: "Test",
        senderEmail: "invalid-email",
      })
    ).rejects.toThrow();
  });
});

describe("campaigns.list", () => {
  it("returns list of campaigns for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaigns.list();

    expect(Array.isArray(result)).toBe(true);
    // All campaigns should belong to the user
    result.forEach((campaign) => {
      expect(campaign.userId).toBe(ctx.user!.id);
    });
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.campaigns.list()).rejects.toThrow();
  });
});

describe("campaigns.getById", () => {
  it("returns campaign details for valid ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a campaign
    const created = await caller.campaigns.create({
      name: "Test Campaign",
      emailSubject: "Test Subject",
      emailBody: "Test body",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    // Then fetch it
    const result = await caller.campaigns.getById({ id: created.id });

    expect(result).toBeDefined();
    if (result) {
      expect(result.id).toBe(created.id);
      expect(result.name).toBe("Test Campaign");
    }
  });

  it("returns null for non-existent campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaigns.getById({ id: 999999 });
    expect(result).toBeNull();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.campaigns.getById({ id: 1 })).rejects.toThrow();
  });
});

describe.skip("campaigns.update", () => {
  it("updates campaign with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a campaign first
    const created = await caller.campaigns.create({
      name: "Original Name",
      emailSubject: "Original Subject",
      emailBody: "Original body",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    // Update it
    const result = await caller.campaigns.update({
      id: created.id,
      name: "Updated Name",
      emailSubject: "Updated Subject",
    });

    expect(result.id).toBe(created.id);
    expect(result.name).toBe("Updated Name");
    expect(result.emailSubject).toBe("Updated Subject");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.campaigns.update({
        id: 1,
        name: "Updated",
      })
    ).rejects.toThrow();
  });
});

describe("campaigns.delete", () => {
  it("deletes campaign successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a campaign first
    const created = await caller.campaigns.create({
      name: "To Delete",
      emailSubject: "Test",
      emailBody: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    // Delete it
    const result = await caller.campaigns.delete({ id: created.id });

    expect(result.success).toBe(true);

    // Verify it's deleted
    const deleted = await caller.campaigns.getById({ id: created.id });
    expect(deleted).toBeNull();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.campaigns.delete({ id: 1 })).rejects.toThrow();
  });
});

describe.skip("campaigns.getStats", () => {
  it("returns campaign statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a campaign first
    const created = await caller.campaigns.create({
      name: "Stats Test",
      emailSubject: "Test",
      emailBody: "Test",
      senderName: "Test",
      senderEmail: "test@test.com",
    });

    const result = await caller.campaigns.getStats({ id: created.id });

    expect(result).toHaveProperty("sent");
    expect(result).toHaveProperty("delivered");
    expect(result).toHaveProperty("opened");
    expect(result).toHaveProperty("clicked");
    expect(result).toHaveProperty("bounced");
    expect(result).toHaveProperty("unsubscribed");
    expect(typeof result.sent).toBe("number");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.campaigns.getStats({ id: 1 })).rejects.toThrow();
  });
});
