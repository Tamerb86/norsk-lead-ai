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
      const { updateMemberRole } = await import("./teamDb");
      return updateMemberRole(input.memberId, user.teamId, input.role);
    }),
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ input }) => {
      const { cancelInvitation } = await import("./teamDb");
      return cancelInvitation(input.invitationId);
    }),
};
