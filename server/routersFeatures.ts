/**
 * Feature routers that the frontend calls but were never wired up.
 * All procedures enforce ownership by filtering on ctx.user.id.
 * Admin-only routers (aiSettings) use adminProcedure.
 */
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  generateEmail,
  improveEmail,
  generateSubjectVariants,
} from "./services/aiEmailWriter";
import {
  chatWithAssistant,
  getQuickSuggestions,
  analyzeConversation,
  handleObjection,
  generatePitch,
} from "./services/aiAssistant";
import {
  generateLeadInsights,
  generateEmailSequence,
  researchCompany,
  generatePersonalizedOutreach,
} from "./services/aiInsights";
import { verifyEmail } from "./services/emailVerification";
import { calculateLeadScore } from "./services/leadScoring";

const languageSchema = z.enum(["norwegian", "english"]).default("norwegian");

/** Webhook event types the system can emit (mirrors the client's list). */
const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "lead.deleted",
  "campaign.created",
  "campaign.sent",
  "campaign.completed",
  "email.opened",
  "email.clicked",
  "email.replied",
  "email.bounced",
] as const;

// ============================================
// AI ROUTER
// ============================================

export const aiRouter = router({
  verifyEmail: protectedProcedure
    .input(z.object({ email: z.string().min(3) }))
    .mutation(async ({ input }) => verifyEmail(input.email)),

  generateEmail: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        location: z.string().optional(),
        contactName: z.string().optional(),
        purpose: z.enum(["sales", "partnership", "introduction", "followup", "custom"]),
        customPurpose: z.string().optional(),
        tone: z.enum(["formal", "friendly", "professional"]),
        language: languageSchema,
        productOrService: z.string().optional(),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => generateEmail(input)),

  improveEmail: protectedProcedure
    .input(
      z.object({
        originalEmail: z.string(),
        instruction: z.string(),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      improveEmail(input.originalEmail, input.instruction, input.language)
    ),

  generateSubjects: protectedProcedure
    .input(
      z.object({
        emailBody: z.string(),
        count: z.number().min(1).max(10).default(5),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      generateSubjectVariants(input.emailBody, input.count, input.language)
    ),

  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
        language: languageSchema,
      })
    )
    .mutation(async ({ ctx, input }) =>
      chatWithAssistant(
        input.messages,
        { userId: ctx.user.id, userName: ctx.user.name ?? undefined },
        input.language
      )
    ),

  getQuickSuggestions: protectedProcedure
    .input(z.object({ language: languageSchema }).optional())
    .query(async ({ ctx, input }) =>
      getQuickSuggestions(
        { userId: ctx.user.id, userName: ctx.user.name ?? undefined },
        input?.language ?? "norwegian"
      )
    ),

  handleObjection: protectedProcedure
    .input(
      z.object({
        objection: z.string(),
        product: z.string().optional(),
        industry: z.string().optional(),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      handleObjection(
        input.objection,
        { product: input.product, industry: input.industry },
        input.language
      )
    ),

  generatePitch: protectedProcedure
    .input(
      z.object({
        product: z.string(),
        targetAudience: z.string(),
        uniqueSellingPoints: z.array(z.string()),
        duration: z.enum(["30s", "60s", "2min"]),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      generatePitch(
        {
          product: input.product,
          targetAudience: input.targetAudience,
          uniqueSellingPoints: input.uniqueSellingPoints,
          duration: input.duration,
        },
        input.language
      )
    ),

  analyzeConversation: protectedProcedure
    .input(
      z.object({
        conversation: z.string(),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      analyzeConversation(input.conversation, input.language)
    ),

  generateLeadInsights: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        contactName: z.string().optional(),
        website: z.string().optional(),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      generateLeadInsights(
        {
          companyName: input.companyName,
          industry: input.industry,
          contactName: input.contactName,
          website: input.website,
        },
        input.language
      )
    ),

  researchCompany: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        website: z.string().optional(),
        additionalInfo: z.string().optional(),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      researchCompany(input.companyName, input.website, input.additionalInfo, input.language)
    ),

  generateEmailSequence: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        goal: z.enum(["nurture", "conversion", "reengagement", "onboarding"]),
        steps: z.number().min(2).max(10).default(5),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      generateEmailSequence(
        { companyName: input.companyName, industry: input.industry },
        input.goal,
        input.steps,
        input.language
      )
    ),

  generatePersonalizedOutreach: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        contactName: z.string().optional(),
        industry: z.string().optional(),
        trigger: z.string().optional(),
        yourProduct: z.string(),
        valueProposition: z.string(),
        language: languageSchema,
      })
    )
    .mutation(async ({ input }) =>
      generatePersonalizedOutreach(
        {
          companyName: input.companyName,
          contactName: input.contactName,
          industry: input.industry,
        },
        {
          trigger: input.trigger,
          yourProduct: input.yourProduct,
          valueProposition: input.valueProposition,
        },
        input.language
      )
    ),
});

// ============================================
// NOTIFICATIONS ROUTER (full replacement)
// ============================================

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => db.getNotifications(ctx.user.id, input.limit)),

  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => db.getNotifications(ctx.user.id, input?.limit ?? 20)),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) =>
    db.getUnreadNotificationCount(ctx.user.id)
  ),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.markNotificationAsRead(input.id, ctx.user.id)),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) =>
    db.markAllNotificationsAsRead(ctx.user.id)
  ),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteNotification(input.id, ctx.user.id)),
});

// ============================================
// SAVED COMPANIES ROUTER
// ============================================

export const savedCompaniesRouter = router({
  checkSaved: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const isSaved = await db.checkCompanySaved(ctx.user.id, input.companyId);
      return { isSaved };
    }),

  save: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        listName: z.string().default("default"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      db.saveCompany({
        userId: ctx.user.id,
        companyId: input.companyId,
        listName: input.listName,
        notes: input.notes,
      })
    ),

  remove: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ ctx, input }) => db.removeSavedCompany(ctx.user.id, input.companyId)),

  getAll: protectedProcedure.query(async ({ ctx }) => db.getSavedCompanies(ctx.user.id)),

  getLists: protectedProcedure.query(async ({ ctx }) => db.getSavedCompanyLists(ctx.user.id)),
});

// ============================================
// LEAD SCORING (ADVANCED) ROUTER
// ============================================

export const leadScoringAdvancedRouter = router({
  getScores: protectedProcedure
    .input(
      z
        .object({
          tier: z.enum(["very_hot", "hot", "warm", "cold"]).optional(),
          minScore: z.number().optional(),
          limit: z.number().min(1).max(200).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => db.getLeadScores(ctx.user.id, input)),

  getLeadsByTier: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["very_hot", "hot", "warm", "cold"]).optional(),
        limit: z.number().min(1).max(500).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [leads, stats] = await Promise.all([
        db.getLeadScores(ctx.user.id, { tier: input.tier, limit: input.limit }),
        db.getLeadScoreTierStats(ctx.user.id),
      ]);
      return { leads, stats };
    }),

  recalculateScores: protectedProcedure.mutation(async ({ ctx }) =>
    db.recalculateLeadScores(ctx.user.id)
  ),

  getRules: protectedProcedure.query(async ({ ctx }) => db.getScoringRules(ctx.user.id)),

  createRule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        ruleType: z.enum(["engagement", "company_attribute", "behavior"]),
        // Either a simple condition keyword ("email_opened") or a structured
        // condition object ({ event: "email_opened" }).
        condition: z.union([z.string().min(1), z.record(z.string(), z.any())]),
        operator: z
          .enum(["equals", "contains", "greater_than", "less_than", "not_equals"])
          .default("equals"),
        value: z.string().default(""),
        scoreChange: z.number(),
        priority: z.number().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) =>
      db.createScoringRule({
        ...input,
        condition:
          typeof input.condition === "string"
            ? input.condition
            : JSON.stringify(input.condition),
        userId: ctx.user.id,
      })
    ),

  updateRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        condition: z.string().optional(),
        operator: z.string().optional(),
        value: z.string().optional(),
        scoreChange: z.number().optional(),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ruleId, ...data } = input;
      return db.updateScoringRule(ruleId, ctx.user.id, data);
    }),

  deleteRule: protectedProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteScoringRule(input.ruleId, ctx.user.id)),
});

// ============================================
// LEAD SCORING (SIMPLE, PER-COMPANY) ROUTER
// ============================================

/** On-the-fly company quality score used by LeadScoreBadge. */
export const leadScoringRouter = router({
  scoreCompany: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const company = await db.getCompanyById(input.companyId);
      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      }
      return calculateLeadScore({
        id: company.id,
        navn: company.navn,
        organisasjonsform: company.organisasjonsform,
        naeringskode1: company.naeringskode1,
        naeringsbeskrivelse1: company.naeringsbeskrivelse1,
        antallAnsatte: company.antallAnsatte,
        epostadresse: company.epostadresse,
        telefon: company.telefon,
        hjemmeside: company.hjemmeside,
        fylke: company.fylke,
        kommune: company.kommune,
        stiftelsesdato: company.stiftelsesdato,
      });
    }),
});

// ============================================
// AI SETTINGS ROUTER (admin only)
// ============================================

export const aiSettingsRouter = router({
  getIntegrations: adminProcedure.query(async () => db.getAIIntegrations()),

  createIntegration: adminProcedure
    .input(
      z.object({
        provider: z.string().min(1),
        name: z.string().min(1),
        apiKey: z.string().min(1),
        apiEndpoint: z.string().optional(),
        model: z.string().optional(),
        isEnabled: z.boolean().default(true),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) =>
      db.createAIIntegration({
        provider: input.provider,
        name: input.name,
        apiKey: input.apiKey,
        apiEndpoint: input.apiEndpoint || null,
        model: input.model || null,
        isEnabled: input.isEnabled,
        isDefault: input.isDefault,
      })
    ),

  updateIntegration: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        apiKey: z.string().optional(),
        apiEndpoint: z.string().optional(),
        model: z.string().optional(),
        isEnabled: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateAIIntegration(id, data);
    }),

  deleteIntegration: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.deleteAIIntegration(input.id)),

  testIntegration: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => db.testAIIntegration(input.id)),

  getSettings: adminProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => db.getSystemSettings(input?.category)),

  setSetting: adminProcedure
    .input(
      z.object({
        key: z.string().min(1),
        value: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        isSecret: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      db.setSystemSetting({ ...input, updatedBy: ctx.user.id })
    ),
});

// ============================================
// A/B TESTS ROUTERS
// ============================================

const abTestCreateInput = z.object({
  campaignId: z.number(),
  name: z.string().min(1),
  testType: z.enum(["subject", "content", "sender", "send_time"]),
  sampleSize: z.number().min(5).max(50),
  winningCriteria: z.enum(["open_rate", "click_rate", "reply_rate"]),
  autoSelectWinner: z.boolean().default(true),
  testDurationHours: z.number().min(1).max(168).default(24),
  variantA: z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
    senderName: z.string().optional(),
    senderEmail: z.string().optional(),
  }),
  variantB: z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
    senderName: z.string().optional(),
    senderEmail: z.string().optional(),
  }),
});

async function createAbTestForUser(
  userId: number,
  input: z.infer<typeof abTestCreateInput>
) {
  // Ownership check: campaign must belong to the user
  const campaign = await db.getCampaignById(input.campaignId, userId);
  if (!campaign) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
  }
  return db.createAbTest({ ...input, userId });
}

/** Router matching the client page (client/src/pages/ABTesting.tsx). */
export const abTestsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => db.getAbTests(ctx.user.id)),

  create: protectedProcedure
    .input(abTestCreateInput)
    .mutation(async ({ ctx, input }) => createAbTestForUser(ctx.user.id, input)),

  start: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ ctx, input }) => db.startAbTest(input.testId, ctx.user.id)),

  selectWinner: protectedProcedure
    .input(z.object({ testId: z.number(), winnerId: z.enum(["A", "B"]) }))
    .mutation(async ({ ctx, input }) =>
      db.selectAbTestWinner(input.testId, ctx.user.id, input.winnerId)
    ),
});

/** Router matching the test spec (server/abTesting.test.ts). */
export const abTestingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => db.getAbTests(ctx.user.id)),

  create: protectedProcedure
    .input(abTestCreateInput)
    .mutation(async ({ ctx, input }) => createAbTestForUser(ctx.user.id, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => db.getAbTestById(input.id, ctx.user.id)),

  selectWinner: protectedProcedure
    .input(z.object({ testId: z.number(), winner: z.enum(["A", "B"]) }))
    .mutation(async ({ ctx, input }) =>
      db.selectAbTestWinner(input.testId, ctx.user.id, input.winner)
    ),
});

// ============================================
// WEBHOOKS ROUTER
// ============================================

/**
 * SSRF guard: reject non-http(s) protocols and hostnames pointing at
 * localhost / private IP ranges.
 */
function assertSafeWebhookUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Ugyldig URL" });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Kun http(s) URL-er er tillatt",
    });
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isBlocked =
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (isBlocked) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "URL-er mot lokale/private adresser er ikke tillatt",
    });
  }
}

function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export const webhooksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => db.getWebhooks(ctx.user.id)),

  getDeliveries: protectedProcedure
    .input(
      z.object({
        webhookId: z.number(),
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) =>
      db.getWebhookDeliveries(input.webhookId, ctx.user.id, input.limit)
    ),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().min(1),
        secret: z.string().optional(),
        events: z
          .array(z.string())
          .min(1)
          .refine((events) => events.every((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e)), {
            message: "Ugyldig webhook-hendelse",
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertSafeWebhookUrl(input.url);
      return db.createWebhook({
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        secret: input.secret || undefined,
        events: input.events,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        webhookId: z.number(),
        name: z.string().optional(),
        url: z.string().optional(),
        secret: z.string().optional(),
        isActive: z.boolean().optional(),
        events: z
          .array(z.string())
          .refine((events) => events.every((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e)), {
            message: "Ugyldig webhook-hendelse",
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { webhookId, ...data } = input;
      if (data.url !== undefined) {
        assertSafeWebhookUrl(data.url);
      }
      return db.updateWebhook(webhookId, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteWebhook(input.webhookId, ctx.user.id)),

  test: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const webhook = (await db.getWebhookById(input.webhookId, ctx.user.id)) as any;
      if (!webhook) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Webhook ikke funnet" });
      }

      assertSafeWebhookUrl(webhook.url);

      const payload = {
        event: "webhook.test",
        timestamp: new Date().toISOString(),
        data: { message: "Dette er en test-webhook fra NorskLeads" },
      };
      const body = JSON.stringify(payload);

      const delivery = await db.createWebhookDelivery({
        webhookId: input.webhookId,
        eventType: "webhook.test",
        payload,
      });

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": "webhook.test",
      };
      if (webhook.secret) {
        headers["X-Webhook-Signature"] = signWebhookPayload(body, webhook.secret);
      }

      const startedAt = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const responseBody = (await response.text()).slice(0, 1000);
        await db.updateWebhookDelivery(delivery.id, {
          status: response.ok ? "success" : "failed",
          responseStatus: response.status,
          responseBody,
          responseTime: Date.now() - startedAt,
          attempts: 1,
        });

        return { success: response.ok, status: response.status };
      } catch (error: any) {
        await db.updateWebhookDelivery(delivery.id, {
          status: "failed",
          errorMessage: String(error?.message || error).slice(0, 500),
          responseTime: Date.now() - startedAt,
          attempts: 1,
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kunne ikke levere test-webhook: " + String(error?.message || error),
        });
      }
    }),
});

// ============================================
// ACTIVITY LOG ROUTER
// ============================================

export const activityLogRouter = router({
  getLogs: protectedProcedure
    .input(
      z
        .object({
          entityType: z.string().optional(),
          entityId: z.number().optional(),
          action: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) =>
      db.getActivityLogs({
        userId: ctx.user.id,
        entityType: input?.entityType,
        entityId: input?.entityId,
        action: input?.action,
        limit: input?.limit,
        offset: input?.offset,
      })
    ),

  getStats: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }).optional())
    .query(async ({ ctx, input }) =>
      db.getActivityLogStats(ctx.user.id, input?.days ?? 30)
    ),
});

// ============================================
// STRIPE ROUTER (subscription checkout)
// ============================================

/** Derive the request origin for checkout redirect URLs. */
function requestOrigin(req: { protocol?: string; headers: Record<string, unknown> }): string {
  const originHeader = req.headers["origin"];
  if (typeof originHeader === "string" && originHeader.startsWith("http")) {
    return originHeader;
  }
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"];
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol ?? "https";
  if (typeof host === "string" && host.length > 0) {
    return `${String(proto).split(",")[0]}://${host}`;
  }
  return "http://localhost:3000";
}

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({ planId: z.enum(["basic", "pro"]) }))
    .mutation(async ({ ctx, input }) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Betaling er ikke konfigurert (STRIPE_SECRET_KEY mangler)",
        });
      }

      const { getPlanById } = await import("@shared/products");
      const plan = getPlanById(input.planId);
      if (!plan || plan.isFree) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ugyldig plan" });
      }

      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const origin = requestOrigin(ctx.req as any);
      const hasRealPriceId =
        plan.stripePriceId && !plan.stripePriceId.endsWith("_placeholder");

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: ctx.user.email ?? undefined,
        line_items: [
          hasRealPriceId
            ? { price: plan.stripePriceId, quantity: 1 }
            : {
                price_data: {
                  currency: plan.currency.toLowerCase(),
                  product_data: { name: `NorskLeads ${plan.name}` },
                  unit_amount: plan.priceMonthly * 100,
                  recurring: { interval: "month" },
                },
                quantity: 1,
              },
        ],
        success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?checkout=cancelled`,
        // The Stripe webhook (server/stripeWebhook.ts) reads user_id + plan_id.
        metadata: {
          user_id: String(ctx.user.id),
          plan_id: plan.id,
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke opprette checkout-sesjon",
        });
      }

      return { url: session.url, sessionId: session.id };
    }),
});
