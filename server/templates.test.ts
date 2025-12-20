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

describe("templates.create", () => {
  it("creates a new template with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.templates.create({
      name: "Test Template",
      subject: "Test Subject {{companyName}}",
      body: "Hello {{contactName}}, this is a test email.",
      category: "cold_outreach",
    });

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Test Template");
    expect(result.subject).toBe("Test Subject {{companyName}}");
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
      caller.templates.create({
        name: "Test",
        subject: "Test",
        body: "Test",
      })
    ).rejects.toThrow();
  });

  it("validates required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.create({
        name: "",
        subject: "Test",
        body: "Test",
      })
    ).rejects.toThrow();
  });

  it("validates template variables syntax", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Should accept valid template variables
    const result = await caller.templates.create({
      name: "Valid Template",
      subject: "Hello {{firstName}}",
      body: "Dear {{firstName}} {{lastName}}, welcome to {{companyName}}!",
    });

    expect(result).toHaveProperty("id");
    expect(result.subject).toContain("{{firstName}}");
  });
});

describe("templates.list", () => {
  it("returns list of templates for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.templates.list();

    expect(Array.isArray(result)).toBe(true);
    // All templates should belong to the user
    result.forEach((template) => {
      expect(template.userId).toBe(ctx.user!.id);
    });
  });

  it("supports filtering by category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create templates with different categories
    await caller.templates.create({
      name: "Cold Outreach Template",
      subject: "Test",
      body: "Test",
      category: "cold_outreach",
    });

    await caller.templates.create({
      name: "Follow-up Template",
      subject: "Test",
      body: "Test",
      category: "follow_up",
    });

    const coldOutreachTemplates = await caller.templates.list({
      category: "cold_outreach",
    });

    expect(Array.isArray(coldOutreachTemplates)).toBe(true);
    coldOutreachTemplates.forEach((template) => {
      expect(template.category).toBe("cold_outreach");
    });
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.list()).rejects.toThrow();
  });
});

describe("templates.getById", () => {
  it("returns template details for valid ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    const created = await caller.templates.create({
      name: "Test Template",
      subject: "Test Subject",
      body: "Test Body",
    });

    // Fetch it
    const result = await caller.templates.getById({ id: created.id });

    expect(result).toBeDefined();
    expect(result.id).toBe(created.id);
    expect(result.name).toBe("Test Template");
  });

  it("throws error for non-existent template", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.getById({ id: 999999 })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.getById({ id: 1 })).rejects.toThrow();
  });
});

describe("templates.update", () => {
  it("updates template with valid input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    const created = await caller.templates.create({
      name: "Original Template",
      subject: "Original Subject",
      body: "Original Body",
    });

    // Update it
    const result = await caller.templates.update({
      id: created.id,
      name: "Updated Template",
      subject: "Updated Subject {{companyName}}",
    });

    expect(result.id).toBe(created.id);
    expect(result.name).toBe("Updated Template");
    expect(result.subject).toBe("Updated Subject {{companyName}}");
  });

  it("preserves unchanged fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template
    const created = await caller.templates.create({
      name: "Test Template",
      subject: "Test Subject",
      body: "Original Body",
    });

    // Update only the name
    const result = await caller.templates.update({
      id: created.id,
      name: "New Name",
    });

    expect(result.name).toBe("New Name");
    expect(result.body).toBe("Original Body");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.update({
        id: 1,
        name: "Updated",
      })
    ).rejects.toThrow();
  });
});

describe("templates.delete", () => {
  it("deletes template successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    const created = await caller.templates.create({
      name: "To Delete",
      subject: "Test",
      body: "Test",
    });

    // Delete it
    const result = await caller.templates.delete({ id: created.id });

    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(
      caller.templates.getById({ id: created.id })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.delete({ id: 1 })).rejects.toThrow();
  });
});

describe.skip("templates.duplicate", () => {
  it("creates a copy of existing template", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create original template
    const original = await caller.templates.create({
      name: "Original Template",
      subject: "Test Subject",
      body: "Test Body",
      category: "cold_outreach",
    });

    // Duplicate it
    const duplicate = await caller.templates.duplicate({ id: original.id });

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.name).toBe("Original Template (Copy)");
    expect(duplicate.subject).toBe(original.subject);
    expect(duplicate.body).toBe(original.body);
    expect(duplicate.category).toBe(original.category);
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.templates.duplicate({ id: 1 })).rejects.toThrow();
  });
});

describe.skip("templates.preview", () => {
  it("renders template with provided variables", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template with variables
    const template = await caller.templates.create({
      name: "Test Template",
      subject: "Hello {{firstName}}!",
      body: "Dear {{firstName}} {{lastName}}, welcome to {{companyName}}!",
    });

    // Preview with variables
    const result = await caller.templates.preview({
      id: template.id,
      variables: {
        firstName: "John",
        lastName: "Doe",
        companyName: "Acme Corp",
      },
    });

    expect(result.subject).toBe("Hello John!");
    expect(result.body).toBe("Dear John Doe, welcome to Acme Corp!");
  });

  it("handles missing variables gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const template = await caller.templates.create({
      name: "Test",
      subject: "Hello {{firstName}}!",
      body: "Welcome {{firstName}}!",
    });

    // Preview without providing variables
    const result = await caller.templates.preview({
      id: template.id,
      variables: {},
    });

    // Should keep placeholders for missing variables
    expect(result.subject).toContain("{{firstName}}");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.templates.preview({
        id: 1,
        variables: {},
      })
    ).rejects.toThrow();
  });
});
