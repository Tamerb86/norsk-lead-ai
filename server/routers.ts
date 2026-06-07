import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getCampaignPerformance } from "./analyticsDb";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      // Return only safe fields — never expose passwordHash, 2FA secrets,
      // backup codes, or Stripe identifiers to the client.
      if (!ctx.user) return null;
      const u = ctx.user;
      return {
        id: u.id,
        openId: u.openId,
        name: u.name,
        email: u.email,
        role: u.role,
        teamId: u.teamId,
        loginMethod: u.loginMethod,
        subscriptionPlan: u.subscriptionPlan,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionPeriodEnd: u.subscriptionPeriodEnd,
        monthlyLeadsQuota: u.monthlyLeadsQuota,
        usedLeadsThisMonth: u.usedLeadsThisMonth,
        twoFactorEnabled: u.twoFactorEnabled,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastSignedIn: u.lastSignedIn,
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================
  // COMPANIES ROUTER
  // ============================================
  companies: router({
    search: protectedProcedure
      .input(
        z.object({
          query: z.string().optional(),
          hasEmail: z.boolean().optional(),
          hasPhone: z.boolean().optional(),
          hasWebsite: z.boolean().optional(),
          poststed: z.string().optional(),
          naeringskode: z.string().optional(),
          organisasjonsform: z.string().optional(),
          foundedAfter: z.string().optional(),
          foundedBefore: z.string().optional(),
          minEmployees: z.number().optional(),
          maxEmployees: z.number().optional(),
          sortBy: z.enum(["employees", "revenue", "age"]).optional(),
          sortOrder: z.enum(["asc", "desc"]).optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const result = await db.searchCompanies(input);
        return result;
      }),

    getSaved: protectedProcedure.query(async ({ ctx }) => {
      const savedCompanies = await db.getSavedCompanies(ctx.user.id);
      return savedCompanies;
    }),

    toggleSave: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.toggleSaveCompany(ctx.user.id, input.companyId);
        return result;
      }),
  }),

  // ============================================
  // LEADS ROUTER
  // ============================================
  leads: router({
    list: protectedProcedure
      .input(
        z.object({
          campaignId: z.number().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const leads = await db.getLeads(ctx.user.id, input.campaignId, input.status);
        return leads;
      }),

    get: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const lead = await db.getLeadById(ctx.user.id, input.id);
        return lead;
      }),

    create: protectedProcedure
      .input(
        z.object({
          campaignId: z.number().optional(),
          companyId: z.number(),
          email: z.string().email().optional(),
          name: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.createLead({
          ...input,
          userId: ctx.user.id,
        });
        return lead;
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.updateLeadStatus(input.id, ctx.user.id, input.status);
        return lead;
      }),

    bulkUpdateStatus: protectedProcedure
      .input(
        z.object({
          ids: z.array(z.number()),
          status: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.bulkUpdateLeadStatus(input.ids, ctx.user.id, input.status);
        return result;
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getLeadStats(ctx.user.id);
      return stats;
    }),
  }),

  // ============================================
  // CAMPAIGNS ROUTER
  // ============================================
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const campaigns = await db.getCampaigns(ctx.user.id);
      return campaigns;
    }),

    get: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const campaign = await db.getCampaignById(input.id, ctx.user.id);
        return campaign;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          status: z.string().optional(),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          emailTemplateId: z.number().optional(),
          senderName: z.string().optional(),
          senderEmail: z.string().email().optional(),
          replyTo: z.string().email().optional(),
          scheduledAt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const campaign = await db.createCampaign({
          ...input,
          userId: ctx.user.id,
        });
        return campaign;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          status: z.string().optional(),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          emailTemplateId: z.number().optional(),
          senderName: z.string().optional(),
          senderEmail: z.string().email().optional(),
          replyTo: z.string().email().optional(),
          scheduledAt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const result = await db.updateCampaign(id, ctx.user.id, data);
        return result;
      }),

    delete: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteCampaign(input.id, ctx.user.id);
        return result;
      }),

    getStats: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { getCampaignStats } = await import("./campaignStats");
        const stats = await getCampaignStats(input.id);
        return stats;
      }),

    getPerformance: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = input.endDate ? new Date(input.endDate) : new Date();

        const performance = await getCampaignPerformance(ctx.user.id, startDate, endDate);
        return performance;
      }),
  }),

  // ============================================
  // DASHBOARD ROUTER
  // ============================================
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const companiesStats = await db.getCompaniesStats();
      const campaigns = await db.getCampaigns(ctx.user.id);
      const recentActivities = await db.getActivities(ctx.user.id, 10);

      const { getDashboardStats } = await import("./campaignStats");
      const campaignStats = await getDashboardStats(ctx.user.id);

      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(
        (c) => c.status === "sending" || c.status === "scheduled"
      ).length;
      const completedCampaigns = campaigns.filter(
        (c) => c.status === "completed"
      ).length;
      const draftCampaigns = campaigns.filter(
        (c) => c.status === "draft"
      ).length;

      return {
        companies: {
          total: companiesStats.totalCompanies,
          withEmail: companiesStats.withEmail,
          withPhone: companiesStats.withPhone,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
          draft: draftCampaigns,
          scheduled: campaigns.filter((c) => c.status === "scheduled").length,
        },
        leads: {
          total: campaignStats?.totalRecipients || 0,
          sent: campaignStats?.totalSent || 0,
          opened: campaignStats?.totalOpened || 0,
          clicked: campaignStats?.totalClicked || 0,
          replied: campaignStats?.totalReplied || 0,
          bounced: campaignStats?.totalBounced || 0,
          unsubscribed: campaignStats?.totalUnsubscribed || 0,
          openRate: campaignStats?.openRate || "0.00",
          clickRate: campaignStats?.clickRate || "0.00",
          replyRate: campaignStats?.replyRate || "0.00",
        },
        performance: {
          openRate: campaignStats?.openRate || "0.00",
          clickRate: campaignStats?.clickRate || "0.00",
          replyRate: campaignStats?.replyRate || "0.00",
          averageEngagement: campaignStats?.averageEngagement || 0,
        },
        recentActivities,
      };
    }),

    recentCampaigns: protectedProcedure.query(async ({ ctx }) => {
      try {
        const campaigns = await db.getCampaigns(ctx.user.id);
        const { getCampaignStats } = await import("./campaignStats");

        const recentCampaigns = await Promise.all(
          campaigns.slice(0, 5).map(async (campaign) => {
            const stats = await getCampaignStats(campaign.id);
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              sentEmails: stats?.totalSent || 0,
              openRate: stats?.openRate || "0.00",
              clickRate: stats?.clickRate || "0.00",
              replyRate: stats?.replyRate || "0.00",
            };
          })
        );

        return recentCampaigns;
      } catch (error) {
        console.error("Error fetching recent campaigns:", error);
        return [];
      }
    }),

    topLeads: protectedProcedure.query(async ({ ctx }) => {
      try {
        const topLeads = await db.getTopLeads(ctx.user.id, 5);
        return topLeads;
      } catch (error) {
        console.error("Error fetching top leads:", error);
        return [];
      }
    }),

    // ✅ FIXED: performance chart using analyticsDb
    performanceChart: protectedProcedure
      .input(
        z.object({
          days: z.number().min(7).max(90).default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const fromDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
          const toDate = new Date();

          const performance = await getCampaignPerformance(ctx.user.id, fromDate, toDate);

          return performance.timeline.map((row) => ({
            date: row.date,
            sent: row.opens + row.clicks + row.replies,
            opened: row.opens,
            replied: row.replies,
          }));
        } catch (error) {
          console.error("Error fetching performance chart:", error);
          return [];
        }
      }),

    leadsByIndustry: protectedProcedure.query(async ({ ctx }) => {
      try {
        const industries = await db.getLeadsByIndustry(ctx.user.id);
        return industries;
      } catch (error) {
        console.error("Error fetching leads by industry:", error);
        return [];
      }
    }),

    leadStatusDistribution: protectedProcedure.query(async ({ ctx }) => {
      try {
        const statuses = await db.getLeadStatusDistribution(ctx.user.id);
        return statuses;
      } catch (error) {
        console.error("Error fetching lead status distribution:", error);
        return [];
      }
    }),
  }),

  // ============================================
  // TEAM ROUTER
  // ============================================
  team: router({
    // Get current user's team info
    get: protectedProcedure.query(async ({ ctx }) => {
      const teamInfo = await db.getTeamInfo(ctx.user.id);
      return teamInfo;
    }),

    // Invite a team member
    invite: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const invitation = await db.inviteTeamMember(ctx.user.id, input.email, input.role);
        return invitation;
      }),

    // Remove a team member
    remove: protectedProcedure
      .input(
        z.object({
          memberId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.removeTeamMember(ctx.user.id, input.memberId);
        return result;
      }),
  }),

  // ============================================
  // NOTIFICATIONS ROUTER
  // ============================================
  notifications: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(50).default(10),
        })
      )
      .query(async ({ ctx, input }) => {
        const notifications = await db.getNotifications(ctx.user.id, input.limit);
        return notifications;
      }),

    markAsRead: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.markNotificationAsRead(ctx.user.id, input.id);
        return result;
      }),
  }),

  // ============================================
  // SAVED FILTERS ROUTER
  // ============================================
  savedFilters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const filters = await db.getSavedFilters(ctx.user.id);
      return filters;
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          filters: z.record(z.any()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const filter = await db.createSavedFilter(ctx.user.id, input.name, input.filters);
        return filter;
      }),

    delete: protectedProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteSavedFilter(ctx.user.id, input.id);
        return result;
      }),
  }),
  // ============================================
  // ENRICHMENT ROUTER
  // ============================================
  enrichment: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const { getEnrichmentStats } = await import("./services/autoEnrichment");
      return await getEnrichmentStats();
    }),
    getSchedulerStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getSchedulerStatus } = await import("./services/enrichmentScheduler");
      return await getSchedulerStatus();
    }),
    startAutoEnrichment: protectedProcedure.mutation(async ({ ctx }) => {
      const { autoEnrichAllCompanies } = await import("./services/autoEnrichment");
      const queued = await autoEnrichAllCompanies();
      return { queued };
    }),
    retryFailedJobs: protectedProcedure.mutation(async ({ ctx }) => {
      const { retryFailedJobs } = await import("./services/autoEnrichment");
      const retried = await retryFailedJobs();
      return { retried };
    }),
    clearOldJobs: protectedProcedure
      .input(z.object({ daysOld: z.number().default(30) }))
      .mutation(async ({ ctx, input }) => {
        const { clearOldJobs } = await import("./services/autoEnrichment");
        const cleared = await clearOldJobs(input.daysOld);
        return { cleared };
      }),
  }),
});

export type AppRouter = typeof appRouter;
