/**
 * Additional tRPC routers that the frontend calls but were never wired up.
 * All of these delegate to existing db/service functions.
 */
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import {
  getCampaignPerformance,
  getLeadAnalytics,
  getSequenceAnalytics,
  getEngagementHeatmap,
  getTopPerformers,
} from "./analyticsDb";

export const analyticsRouter = router({
  campaignPerformance: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getCampaignPerformance(ctx.user.id, new Date(input.startDate), new Date(input.endDate));
    }),
  leadAnalytics: protectedProcedure.query(async ({ ctx }) => getLeadAnalytics(ctx.user.id)),
  sequenceAnalytics: protectedProcedure.query(async ({ ctx }) => getSequenceAnalytics(ctx.user.id)),
  engagementHeatmap: protectedProcedure.query(async ({ ctx }) => getEngagementHeatmap(ctx.user.id)),
  topPerformers: protectedProcedure.query(async ({ ctx }) => getTopPerformers(ctx.user.id)),
});

export const templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => db.getTemplates(ctx.user.id)),
  create: protectedProcedure
    .input(z.object({ name: z.string(), subject: z.string(), body: z.string(), category: z.string().optional() }))
    .mutation(async ({ ctx, input }) => db.createTemplate({ ...input, userId: ctx.user.id })),
  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), subject: z.string().optional(), body: z.string().optional(), category: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateTemplate(id, ctx.user.id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteTemplate(input.id, ctx.user.id)),
});

export const sequencesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { getSequences } = await import("./sequenceDb");
    return getSequences(ctx.user.id);
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { createSequence } = await import("./sequenceDb");
      return createSequence({ ...input, userId: ctx.user.id });
    }),
  update: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), status: z.enum(["active", "paused", "archived"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { updateSequence } = await import("./sequenceDb");
      const { id, ...data } = input;
      return updateSequence(id, ctx.user.id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { deleteSequence } = await import("./sequenceDb");
      return deleteSequence(input.id, ctx.user.id);
    }),
});

export const calendarRouter = router({
  getUpcoming: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const events = await db.getCalendarEvents(ctx.user.id, { startDate: new Date() });
      return (events as any[]).slice(0, input.limit);
    }),
  getEvents: protectedProcedure
    .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional(), eventType: z.string().optional() }))
    .query(async ({ ctx, input }) => db.getCalendarEvents(ctx.user.id, {
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      eventType: input.eventType,
    })),
  getCountByType: protectedProcedure.query(async ({ ctx }) => db.getEventsCountByType(ctx.user.id)),
  create: protectedProcedure
    .input(z.object({ title: z.string(), description: z.string().optional(), eventType: z.string(), startTime: z.string(), endTime: z.string().optional(), location: z.string().optional(), reminderMinutes: z.number().optional(), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => db.createCalendarEvent({
      userId: ctx.user.id, title: input.title, description: input.description, eventType: input.eventType,
      startTime: new Date(input.startTime), endTime: input.endTime ? new Date(input.endTime) : undefined,
      location: input.location, reminderMinutes: input.reminderMinutes, color: input.color,
    })),
  update: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().optional(), description: z.string().optional(), eventType: z.string().optional(), startTime: z.string().optional(), endTime: z.string().optional(), location: z.string().optional(), reminderMinutes: z.number().optional(), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, startTime, endTime, ...rest } = input;
      return db.updateCalendarEvent(id, ctx.user.id, {
        ...rest,
        ...(startTime ? { startTime: new Date(startTime) } : {}),
        ...(endTime ? { endTime: new Date(endTime) } : {}),
      } as any);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => db.deleteCalendarEvent(input.id, ctx.user.id)),
});

export const referralRouter = router({
  getMyStats: protectedProcedure.query(async ({ ctx }) => db.getOrCreateReferralStats(ctx.user.id)),
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => db.getReferralsByUser(ctx.user.id)),
  sendInvite: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => db.createReferralInvite(ctx.user.id, input.email)),
  validateCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const found = await db.findReferralByCode(input.code);
      return { valid: !!found, referral: found };
    }),
  claimReward: protectedProcedure
    .input(z.object({ referralId: z.number() }))
    .mutation(async ({ ctx, input }) => db.claimReferralReward(ctx.user.id, input.referralId)),
});

export const leadsExtraRouter = {
  checkWebsite: protectedProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ input }) => {
      const { checkWebsite } = await import("./enrichment/websiteChecker");
      return checkWebsite(input.url);
    }),
  validateEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ input }) => {
      const { validateEmail } = await import("./enrichment/emailValidator");
      return validateEmail(input.email);
    }),
  validatePhone: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ input }) => {
      const { validatePhone } = await import("./enrichment/phoneValidator");
      return validatePhone(input.phone);
    }),
  // Bulk-create real leads from selected companies, into a new or existing campaign.
  createFromCompanies: protectedProcedure
    .input(
      z.object({
        companyIds: z.array(z.number()).min(1),
        campaignId: z.number().optional(),
        newCampaignName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Resolve the target campaign (create one if needed)
      let campaignId = input.campaignId;
      let campaignName: string | undefined;
      if (!campaignId) {
        const name =
          input.newCampaignName?.trim() ||
          `Søk ${new Date().toLocaleDateString("nb-NO")}`;
        const campaign = await db.createCampaign({ userId: ctx.user.id, name });
        campaignId = campaign.id;
        campaignName = campaign.name;
      }

      // Skip companies already added as leads to this campaign
      const existing = await db.getLeadsByCampaign(campaignId, ctx.user.id);
      const existingCompanyIds = new Set(
        (existing as any[]).map((r) => r.lead?.companyId ?? r.companyId)
      );

      let created = 0;
      let skipped = 0;
      for (const companyId of input.companyIds) {
        if (existingCompanyIds.has(companyId)) {
          skipped += 1;
          continue;
        }
        try {
          await db.addLeadToCampaign({ userId: ctx.user.id, campaignId, companyId });
          created += 1;
        } catch {
          skipped += 1;
        }
      }

      return { campaignId, campaignName, created, skipped };
    }),
};

export const teamExtraRouter = {
  getMyTeam: protectedProcedure.query(async ({ ctx }) => db.getTeamInfo(ctx.user.id)),
  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user?.teamId) return [];
    const { getTeamMembers } = await import("./teamDb");
    return getTeamMembers(user.teamId);
  }),
  getInvitations: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user?.teamId) return [];
    const { getTeamInvitations } = await import("./teamDb");
    return getTeamInvitations(user.teamId);
  }),
  inviteMember: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.string() }))
    .mutation(async ({ ctx, input }) => db.inviteTeamMember(ctx.user.id, input.email, input.role)),
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => db.removeTeamMember(ctx.user.id, input.memberId)),
  updateMemberRole: protectedProcedure
    .input(z.object({ memberId: z.number(), role: z.enum(["admin", "manager", "viewer"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.teamId) throw new Error("You are not part of a team");
      const { getTeamById, updateMemberRole } = await import("./teamDb");
      const team = await getTeamById(user.teamId);
      if (team?.ownerId !== ctx.user.id && user.role !== "admin") {
        throw new Error("Only the team owner or an admin can change member roles");
      }
      if (input.memberId === team?.ownerId) {
        throw new Error("The team owner's role cannot be changed");
      }
      return updateMemberRole(input.memberId, user.teamId, input.role);
    }),
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.teamId) throw new Error("You are not part of a team");
      const { getTeamById, getTeamInvitations, cancelInvitation } = await import("./teamDb");
      const team = await getTeamById(user.teamId);
      if (team?.ownerId !== ctx.user.id && user.role !== "admin") {
        throw new Error("Only the team owner or an admin can cancel invitations");
      }
      // Ensure the invitation belongs to the caller's team (prevent IDOR)
      const invitations = await getTeamInvitations(user.teamId);
      if (!invitations.some((inv: any) => inv.id === input.invitationId)) {
        throw new Error("Invitation not found for your team");
      }
      return cancelInvitation(input.invitationId);
    }),
};

// ============================================
// BRREG DATA SYNC
// ============================================
import { adminProcedure } from "./_core/trpc";

export const brregRouter = router({
  status: protectedProcedure.query(async () => {
    const { getBrregSyncStatus } = await import("./services/brregSync");
    return getBrregSyncStatus();
  }),
  // Heavy operation — admin only
  syncNow: adminProcedure
    .input(z.object({ since: z.string().optional(), maxRecords: z.number().min(1).max(20000).optional() }))
    .mutation(async ({ input }) => {
      const { syncBrregUpdates } = await import("./services/brregSync");
      return syncBrregUpdates(input);
    }),
  // Refresh a single company from Brreg (used by per-company action)
  refreshCompany: protectedProcedure
    .input(z.object({ orgNr: z.string() }))
    .mutation(async ({ input }) => {
      const { refreshCompaniesByOrgNr } = await import("./services/brregSync");
      return refreshCompaniesByOrgNr([input.orgNr]);
    }),
});

// ============================================
// EMAIL FINDER / ENRICHMENT
// ============================================
export const emailFinderRouter = router({
  getStats: protectedProcedure.query(async () => {
    return db.getEmailEnrichmentStats();
  }),

  getCompaniesWithoutEmail: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        fylke: z.string().optional(),
        kommune: z.string().optional(),
        hasWebsite: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getCompaniesWithoutEmail(input);
    }),

  // Find an email for a single company (scrape its website, then validate).
  findEmail: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ input }) => {
      const company = await db.getCompanyById(input.companyId);
      if (!company) throw new Error("Company not found");
      if (!company.hjemmeside) {
        return { email: null, companyName: company.navn, source: null, confidence: 0 };
      }

      const { scrapeEmailFromWebsite } = await import("./enrichment/googleMapsEmailFinder");
      const { quickValidate } = await import("./services/emailVerification");

      const scraped = await scrapeEmailFromWebsite(company.hjemmeside);
      let email = scraped.email;

      // Reject obviously invalid addresses
      if (email && !quickValidate(email).valid) email = null;

      if (email) {
        await db.updateCompanyContact(company.id, { epostadresse: email });
        return {
          email,
          companyName: company.navn,
          source: "website_scrape" as const,
          confidence: (scraped as any).confidence ?? 70,
        };
      }
      return { email: null, companyName: company.navn, source: null, confidence: 0 };
    }),

  // Bulk: scrape + store emails for companies that have a website but no email.
  autoEnrich: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        fylke: z.string().optional(),
        kommune: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const companies = await db.getCompaniesWithoutEmail({
        limit: input.limit,
        fylke: input.fylke,
        kommune: input.kommune,
        hasWebsite: true,
      });

      const { scrapeEmailFromWebsite } = await import("./enrichment/googleMapsEmailFinder");
      const { quickValidate } = await import("./services/emailVerification");

      let found = 0;
      let updated = 0;
      let processed = 0;
      for (const c of companies as any[]) {
        processed += 1;
        if (!c.hjemmeside) continue;
        try {
          const scraped = await scrapeEmailFromWebsite(c.hjemmeside);
          let email = scraped.email;
          if (email && !quickValidate(email).valid) email = null;
          if (email) {
            found += 1;
            await db.updateCompanyContact(c.id, { epostadresse: email });
            updated += 1;
          }
        } catch {
          /* skip */
        }
        // gentle pacing — we are scraping external sites
        if (processed % 10 === 0) await new Promise((r) => setTimeout(r, 500));
      }

      return { processed, found, updated };
    }),
});
