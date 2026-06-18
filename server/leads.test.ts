import { describe, expect, it } from "vitest";
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

describe("leads.create", () => {
  it("creates a new lead with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.create({
      companyName: "Test Company",
      email: "contact@testcompany.com",
      phone: "+4712345678",
      website: "https://testcompany.com",
      industry: "Technology",
      employees: 50,
      notes: "Test notes",
    });

    expect(result).toHaveProperty("id");
    expect(result.companyName).toBe("Test Company");
    expect(result.email).toBe("contact@testcompany.com");
    expect(result.status).toBe("new");
    expect(result.userId).toBe(ctx.user!.id);
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.create({
        companyName: "Test Company",
        email: "test@test.com",
      })
    ).rejects.toThrow();
  });

  it("validates required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.create({
        companyName: "",
        email: "test@test.com",
      })
    ).rejects.toThrow();
  });

  it("validates email format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.create({
        companyName: "Test",
        email: "invalid-email",
      })
    ).rejects.toThrow();
  });
});

describe("leads.list", () => {
  it("returns list of leads for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toHaveProperty("leads");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.leads)).toBe(true);
    expect(typeof result.total).toBe("number");
    
    // All leads should belong to the user
    result.leads.forEach((lead) => {
      expect(lead.userId).toBe(ctx.user!.id);
    });
  });

  it("supports filtering by status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.list({
      status: "new",
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(result.leads)).toBe(true);
    // All returned leads should have status 'new'
    result.leads.forEach((lead) => {
      expect(lead.status).toBe("new");
    });
  });

  it("supports search by company name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead first
    await caller.leads.create({
      companyName: "Unique Company Name",
      email: "unique@test.com",
    });

    const result = await caller.leads.list({
      search: "Unique Company",
      limit: 10,
      offset: 0,
    });

    expect(result.leads.length).toBeGreaterThan(0);
    expect(
      result.leads.some((lead) => lead.companyName.includes("Unique Company"))
    ).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });
});

describe("leads.getById", () => {
  it("returns lead details for valid ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead first
    const created = await caller.leads.create({
      companyName: "Test Company",
      email: "test@test.com",
    });

    // Fetch it
    const result = await caller.leads.getById({ id: created.id });

    expect(result).toBeDefined();
    expect(result.id).toBe(created.id);
    expect(result.companyName).toBe("Test Company");
  });

  it("throws error for non-existent lead", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.leads.getById({ id: 999999 })).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.leads.getById({ id: 1 })).rejects.toThrow();
  });
});

describe("leads.update", () => {
  it("updates lead with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead first
    const created = await caller.leads.create({
      companyName: "Original Company",
      email: "original@test.com",
    });

    // Update it
    const result = await caller.leads.update({
      id: created.id,
      companyName: "Updated Company",
      status: "contacted",
    });

    expect(result.id).toBe(created.id);
    expect(result.companyName).toBe("Updated Company");
    expect(result.status).toBe("contacted");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.update({
        id: 1,
        companyName: "Updated",
      })
    ).rejects.toThrow();
  });
});

describe("leads.delete", () => {
  it("deletes lead successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead first
    const created = await caller.leads.create({
      companyName: "To Delete",
      email: "delete@test.com",
    });

    // Delete it
    const result = await caller.leads.delete({ id: created.id });

    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(caller.leads.getById({ id: created.id })).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.leads.delete({ id: 1 })).rejects.toThrow();
  });
});

describe.skip("leads.bulkImport", () => {
  it("imports multiple leads successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.bulkImport({
      leads: [
        {
          companyName: "Company 1",
          email: "company1@test.com",
        },
        {
          companyName: "Company 2",
          email: "company2@test.com",
        },
        {
          companyName: "Company 3",
          email: "company3@test.com",
        },
      ],
    });

    expect(result.imported).toBe(3);
    expect(result.failed).toBe(0);
  });

  it("handles invalid data gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leads.bulkImport({
      leads: [
        {
          companyName: "Valid Company",
          email: "valid@test.com",
        },
        {
          companyName: "",
          email: "invalid-email",
        },
      ],
    });

    expect(result.imported).toBeGreaterThanOrEqual(1);
    expect(result.failed).toBeGreaterThanOrEqual(1);
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.bulkImport({
        leads: [{ companyName: "Test", email: "test@test.com" }],
      })
    ).rejects.toThrow();
  });
});
