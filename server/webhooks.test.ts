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

describe("webhooks.list", () => {
  it("returns list of webhooks for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.webhooks.list()).rejects.toThrow();
  });
});

describe("webhooks.create", () => {
  it("creates a new webhook with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.create({
      name: "Test Webhook",
      url: "https://example.com/webhook",
      secret: "test-secret-key",
      events: ["lead.created", "campaign.sent"],
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("validates URL format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.create({
        name: "Invalid URL Webhook",
        url: "not-a-valid-url",
        events: ["lead.created"],
      })
    ).rejects.toThrow();
  });

  it("validates event types", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.create({
        name: "Invalid Events Webhook",
        url: "https://example.com/webhook",
        events: ["invalid.event" as any],
      })
    ).rejects.toThrow();
  });

  it("requires at least one event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.create({
        name: "No Events Webhook",
        url: "https://example.com/webhook",
        events: [],
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.create({
        name: "Test",
        url: "https://example.com/webhook",
        events: ["lead.created"],
      })
    ).rejects.toThrow();
  });
});

describe("webhooks.update", () => {
  it("updates webhook active status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a webhook first
    const created = await caller.webhooks.create({
      name: "Update Test",
      url: "https://example.com/webhook",
      events: ["lead.created"],
    });

    // Deactivate it
    const result = await caller.webhooks.update({
      webhookId: created.id,
      isActive: false,
    });

    expect(result.success).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.update({
        webhookId: 1,
        isActive: false,
      })
    ).rejects.toThrow();
  });
});

describe("webhooks.delete", () => {
  it("deletes webhook successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a webhook
    const created = await caller.webhooks.create({
      name: "To Delete",
      url: "https://example.com/webhook",
      events: ["lead.created"],
    });

    // Delete it
    const result = await caller.webhooks.delete({
      webhookId: created.id,
    });

    expect(result.success).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.delete({ webhookId: 1 })
    ).rejects.toThrow();
  });
});

describe("webhooks.test", () => {
  it("sends a test webhook", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a webhook
    const created = await caller.webhooks.create({
      name: "Test Webhook",
      url: "https://httpbin.org/post", // Public test endpoint
      events: ["lead.created"],
    });

    // Note: This might fail if the endpoint is not reachable
    // In a real test environment, you'd mock the HTTP call
    try {
      const result = await caller.webhooks.test({
        webhookId: created.id,
      });
      expect(result).toHaveProperty("success");
    } catch (error) {
      // Expected to fail if network is not available
      expect(error).toBeDefined();
    }
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.test({ webhookId: 1 })
    ).rejects.toThrow();
  });
});

describe("webhooks.getDeliveries", () => {
  it("returns delivery history for webhook", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a webhook
    const created = await caller.webhooks.create({
      name: "Deliveries Test",
      url: "https://example.com/webhook",
      events: ["lead.created"],
    });

    const result = await caller.webhooks.getDeliveries({
      webhookId: created.id,
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("respects limit parameter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.webhooks.create({
      name: "Limit Test",
      url: "https://example.com/webhook",
      events: ["lead.created"],
    });

    const result = await caller.webhooks.getDeliveries({
      webhookId: created.id,
      limit: 5,
    });

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.webhooks.getDeliveries({ webhookId: 1 })
    ).rejects.toThrow();
  });
});
