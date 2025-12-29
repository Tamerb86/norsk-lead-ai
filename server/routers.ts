import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
          fylke: z.string().optional(),
          kommune: z.string().optional(),
          poststed: z.string().optional(),
          naeringskode: z.string().optional(),
          organisasjonsform: z.string().optional(),
          foundedAfter: z.string().optional(),
          foundedBefore: z.string().optional(),
          minEmployees: z.number().optional(),
          maxEmployees: z.number().optional(),
          hasEmail: z.boolean().optional(),
          hasPhone: z.boolean().optional(),
          hasWebsite: z.boolean().optional(),
          sortBy: z.enum(['name', 'employees', 'founded', 'recent']).optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.searchCompanies(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompanyById(input.id);
      }),

    stats: protectedProcedure.query(async () => {
      return await db.getCompaniesStats();
    }),
  }),

  // ============================================
  // CAMPAIGNS ROUTER
  // ============================================
  campaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCampaigns(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getCampaignById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          senderName: z.string().optional(),
          senderEmail: z.string().optional(),
          replyTo: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createCampaign({
          userId: ctx.user.id,
          ...input,
        });

        await db.createActivity({
          userId: ctx.user.id,
          campaignId: result.id,
          type: "campaign_created",
          description: `Created campaign: ${input.name}`,
        });

        // Log activity
        const { logCreate } = await import('./services/activityLogger');
        await logCreate(ctx.user.id, 'campaign', result.id, input.name);

        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          status: z.string().optional(),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          senderName: z.string().optional(),
          senderEmail: z.string().optional(),
          replyTo: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const result = await db.updateCampaign(id, ctx.user.id, data);

        await db.createActivity({
          userId: ctx.user.id,
          campaignId: id,
          type: "campaign_updated",
          description: `Updated campaign`,
        });

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteCampaign(input.id, ctx.user.id);

        await db.createActivity({
          userId: ctx.user.id,
          campaignId: input.id,
          type: "campaign_deleted",
          description: `Deleted campaign`,
        });

        // Log activity
        const { logDelete } = await import('./services/activityLogger');
        await logDelete(ctx.user.id, 'campaign', input.id, 'Kampanje slettet');

        return result;
      }),

    // Update campaign stats
    updateStats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .mutation(async ({ input }) => {
        const { updateCampaignStats } = await import("./campaignStats");
        return await updateCampaignStats(input.campaignId);
      }),

    // Get campaign analytics
    getAnalytics: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getCampaignAnalytics } = await import("./campaignStats");
        return await getCampaignAnalytics(input.campaignId);
      }),

    // Send campaign emails (queue them for sending)
    send: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          leadIds: z.array(z.number()),
          scheduledAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { queueCampaignEmails } = await import("./db");
        const result = await queueCampaignEmails(
          input.campaignId,
          input.leadIds,
          input.scheduledAt || new Date()
        );

        await db.createActivity({
          userId: ctx.user.id,
          campaignId: input.campaignId,
          type: "campaign_sent",
          description: `Queued ${input.leadIds.length} emails for sending`,
        });

        return result;
      }),

    // Process email queue manually
    processQueue: protectedProcedure.mutation(async ({ ctx }) => {
      const { processEmailQueue } = await import("./emailQueueProcessor");
      const result = await processEmailQueue();

      await db.createActivity({
        userId: ctx.user.id,
        type: "queue_processed",
        description: `Processed queue: ${result.sent} sent, ${result.failed} failed`,
      });

      return result;
    }),

    // Get queue statistics
    getQueueStats: protectedProcedure.query(async () => {
      const { getQueueStats } = await import("./emailQueueProcessor");
      return await getQueueStats();
    }),

    // Test SendGrid connection
    testSendGrid: protectedProcedure.mutation(async () => {
      const { testSendGridConnection } = await import("./emailService");
      return await testSendGridConnection();
    }),
  }),

  // ============================================
  // LEADS ROUTER
  // ============================================
  leads: router({
    list: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLeadsByCampaign(input.campaignId, ctx.user.id);
      }),

    addToCampaign: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          companyId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.addLeadToCampaign({
          userId: ctx.user.id,
          ...input,
        });

        await db.createActivity({
          userId: ctx.user.id,
          leadId: result.id,
          campaignId: input.campaignId,
          type: "lead_added",
          description: `Added lead to campaign`,
        });

        return result;
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.updateLeadStatus(
          input.id,
          ctx.user.id,
          input.status
        );

        await db.createActivity({
          userId: ctx.user.id,
          leadId: input.id,
          type: "lead_status_updated",
          description: `Updated lead status to: ${input.status}`,
        });

        return result;
      }),

    // Enrichment endpoints
    validateEmail: protectedProcedure
      .input(z.object({ email: z.string() }))
      .mutation(async ({ input }) => {
        const { validateEmail } = await import("./enrichment/emailValidator");
        return await validateEmail(input.email);
      }),

    validatePhone: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ input }) => {
        const { validatePhone } = await import("./enrichment/phoneValidator");
        return validatePhone(input.phone);
      }),

    checkWebsite: protectedProcedure
      .input(z.object({ url: z.string() }))
      .mutation(async ({ input }) => {
        const { checkWebsite } = await import("./enrichment/websiteChecker");
        return await checkWebsite(input.url);
      }),
  }),

  // ============================================
  // TEMPLATES ROUTER
  // ============================================
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTemplates(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          subject: z.string(),
          body: z.string(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createTemplate({
          userId: ctx.user.id,
          ...input,
        });

        await db.createActivity({
          userId: ctx.user.id,
          type: "template_created",
          description: `Created template: ${input.name}`,
        });

        // Log activity
        const { logCreate } = await import('./services/activityLogger');
        await logCreate(ctx.user.id, 'template', result.id, input.name);

        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          subject: z.string().optional(),
          body: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const result = await db.updateTemplate(id, ctx.user.id, data);

        await db.createActivity({
          userId: ctx.user.id,
          type: "template_updated",
          description: `Updated template`,
        });

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteTemplate(input.id, ctx.user.id);

        await db.createActivity({
          userId: ctx.user.id,
          type: "template_deleted",
          description: `Deleted template`,
        });

        return result;
      }),
  }),

  // ============================================
  // ACTIVITIES ROUTER
  // ============================================
  activities: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getActivities(ctx.user.id, input.limit);
      }),
  }),

  // ============================================
  // SAVED FILTERS ROUTER
  // ============================================
  savedFilters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedFilters(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          filters: z.any(), // JSON object with filter criteria
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createSavedFilter({
          userId: ctx.user.id,
          name: input.name,
          filters: input.filters,
        });

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteSavedFilter(input.id, ctx.user.id);
        return result;
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
      
      // Get aggregated campaign stats
      const { getDashboardStats } = await import("./campaignStats");
      const campaignStats = await getDashboardStats(ctx.user.id);

      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(
        (c) => c.status === "sending" || c.status === "scheduled"
      ).length;
      const completedCampaigns = campaigns.filter(
        (c) => c.status === "completed"
      ).length;

      return {
        companies: companiesStats,
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
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
        recentActivities,
      };
    }),

    // Get recent campaigns with stats
    recentCampaigns: protectedProcedure.query(async ({ ctx }) => {
      try {
        const campaigns = await db.getCampaigns(ctx.user.id);
        const { getCampaignStats } = await import("./campaignStats");
        
        // Get last 5 campaigns with their stats
        const recentCampaigns = await Promise.all(
          campaigns.slice(0, 5).map(async (campaign) => {
            const stats = await getCampaignStats(campaign.id);
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              createdAt: campaign.createdAt,
              sent: stats?.sent || 0,
              opened: stats?.opened || 0,
              replied: stats?.replied || 0,
              openRate: stats?.sent > 0 ? ((stats?.opened || 0) / stats.sent * 100).toFixed(1) : "0.0",
            };
          })
        );
        return recentCampaigns;
      } catch (error) {
        console.error("Error fetching recent campaigns:", error);
        return [];
      }
    }),

    // Get top performing leads
    topLeads: protectedProcedure.query(async ({ ctx }) => {
      try {
        const topLeads = await db.getTopLeads(ctx.user.id, 5);
        return topLeads;
      } catch (error) {
        console.error("Error fetching top leads:", error);
        return [];
      }
    }),

    // Get performance chart data
    performanceChart: protectedProcedure
      .input(z.object({
        days: z.number().min(7).max(90).default(30),
      }))
      .query(async ({ ctx, input }) => {
        try {
          const { getDailyStats } = await import("./campaignStats");
          const dailyStats = await getDailyStats(ctx.user.id, input.days);
          return dailyStats;
        } catch (error) {
          console.error("Error fetching performance chart:", error);
          // Return sample data if no real data
          const days = input.days;
          const data = [];
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
              date: date.toISOString().split('T')[0],
              sent: 0,
              opened: 0,
              replied: 0,
            });
          }
          return data;
        }
      }),

    // Get leads by industry
    leadsByIndustry: protectedProcedure.query(async ({ ctx }) => {
      try {
        const industries = await db.getLeadsByIndustry(ctx.user.id);
        return industries;
      } catch (error) {
        console.error("Error fetching leads by industry:", error);
        return [];
      }
    }),

    // Get lead status distribution
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
    // Get current user's team
    getMyTeam: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.teamId) return null;
      const teamDb = await import("./teamDb");
      return await teamDb.getTeamById(ctx.user.teamId);
    }),

    // Get team members
    getMembers: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.teamId) return [];
      const teamDb = await import("./teamDb");
      return await teamDb.getTeamMembers(ctx.user.teamId);
    }),

    // Create team (admin only)
    create: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { requireRole } = await import("./rbac");
        requireRole("admin")(ctx);

        const teamDb = await import("./teamDb");
        return await teamDb.createTeam({
          name: input.name,
          ownerId: ctx.user.id,
        });
      }),

    // Update team (admin only)
    update: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { requireRole } = await import("./rbac");
        requireRole("admin")(ctx);

        if (!ctx.user.teamId) {
          throw new Error("You are not part of a team");
        }

        const teamDb = await import("./teamDb");
        return await teamDb.updateTeam(ctx.user.teamId, ctx.user.id, {
          name: input.name,
        });
      }),

    // Invite member (admin only)
    inviteMember: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: z.enum(["admin", "manager", "viewer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { requireRole } = await import("./rbac");
        requireRole("admin")(ctx);

        if (!ctx.user.teamId) {
          throw new Error("You are not part of a team");
        }

        const teamDb = await import("./teamDb");
        return await teamDb.createInvitation({
          teamId: ctx.user.teamId,
          email: input.email,
          role: input.role,
          invitedBy: ctx.user.id,
        });
      }),

    // Get team invitations
    getInvitations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.teamId) return [];
      const teamDb = await import("./teamDb");
      return await teamDb.getTeamInvitations(ctx.user.teamId);
    }),

    // Get my pending invitations
    getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.email) return [];
      const teamDb = await import("./teamDb");
      return await teamDb.getPendingInvitationsByEmail(ctx.user.email);
    }),

    // Accept invitation
    acceptInvitation: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const teamDb = await import("./teamDb");
        return await teamDb.acceptInvitation(input.token, ctx.user.id);
      }),

    // Decline invitation
    declineInvitation: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const teamDb = await import("./teamDb");
        return await teamDb.declineInvitation(input.token);
      }),

    // Cancel invitation (admin only)
    cancelInvitation: protectedProcedure
      .input(z.object({ invitationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { requireRole } = await import("./rbac");
        requireRole("admin")(ctx);

        if (!ctx.user.teamId) {
          throw new Error("You are not part of a team");
        }

        const teamDb = await import("./teamDb");
        return await teamDb.cancelInvitation(
          input.invitationId,
          ctx.user.teamId
        );
      }),

    // Update member role (admin only)
    updateMemberRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["admin", "manager", "viewer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { requireRole } = await import("./rbac");
        requireRole("admin")(ctx);

        if (!ctx.user.teamId) {
          throw new Error("You are not part of a team");
        }

        const teamDb = await import("./teamDb");
        return await teamDb.updateMemberRole(
          input.userId,
          ctx.user.teamId,
          input.role
        );
      }),

    // Remove member (admin only)
    removeMember: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { requireRole } = await import("./rbac");
        requireRole("admin")(ctx);

        if (!ctx.user.teamId) {
          throw new Error("You are not part of a team");
        }

        const teamDb = await import("./teamDb");
        return await teamDb.removeMember(input.userId, ctx.user.teamId);
      }),

    // Get team activities
    getActivities: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.teamId) return [];
        const teamDb = await import("./teamDb");
        return await teamDb.getTeamActivities(ctx.user.teamId, input.limit || 50);
      }),
  }),

  // ============================================
  // SEQUENCES ROUTER
  // ============================================
  sequences: router({
    // Get all sequences
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const sequenceDb = await import("./sequenceDb");
      return await sequenceDb.getSequences(ctx.user.id);
    }),

    // Get sequence by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.getSequenceById(input.id);
      }),

    // Create sequence
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.createSequence({
          userId: ctx.user.id,
          teamId: ctx.user.teamId || undefined,
          ...input,
        });
      }),

    // Update sequence
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["active", "paused", "archived"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.updateSequence(id, ctx.user.id, data);
      }),

    // Delete sequence
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.deleteSequence(input.id, ctx.user.id);
      }),

    // Get steps
    getSteps: protectedProcedure
      .input(z.object({ sequenceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.getSteps(input.sequenceId);
      }),

    // Create step
    createStep: protectedProcedure
      .input(
        z.object({
          sequenceId: z.number(),
          stepNumber: z.number(),
          name: z.string(),
          subject: z.string(),
          body: z.string(),
          delayDays: z.number().optional(),
          delayHours: z.number().optional(),
          triggerType: z
            .enum(["time", "opened", "clicked", "replied", "not_opened", "not_replied"])
            .optional(),
          stopOnReply: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.createStep(input);
      }),

    // Update step
    updateStep: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          subject: z.string().optional(),
          body: z.string().optional(),
          delayDays: z.number().optional(),
          delayHours: z.number().optional(),
          triggerType: z
            .enum(["time", "opened", "clicked", "replied", "not_opened", "not_replied"])
            .optional(),
          stopOnReply: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.updateStep(id, data);
      }),

    // Delete step
    deleteStep: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.deleteStep(input.id);
      }),

    // Reorder steps
    reorderSteps: protectedProcedure
      .input(
        z.object({
          sequenceId: z.number(),
          stepIds: z.array(z.number()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.reorderSteps(input.sequenceId, input.stepIds);
      }),

    // Enroll lead
    enrollLead: protectedProcedure
      .input(
        z.object({
          sequenceId: z.number(),
          leadId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.enrollLead(input);
      }),

    // Unenroll lead
    unenrollLead: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.unenrollLead(input.enrollmentId);
      }),

    // Get enrollments
    getEnrollments: protectedProcedure
      .input(z.object({ sequenceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.getEnrollments(input.sequenceId);
      }),

    // Get enrollment status
    getEnrollmentStatus: protectedProcedure
      .input(
        z.object({
          sequenceId: z.number(),
          leadId: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const sequenceDb = await import("./sequenceDb");
        return await sequenceDb.getEnrollmentStatus(
          input.sequenceId,
          input.leadId
        );
      }),
  }),

  // ============================================
  // ANALYTICS ROUTER
  // ============================================
  analytics: router({
    // Get campaign performance metrics
    campaignPerformance: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const analyticsDb = await import("./analyticsDb");
          return await analyticsDb.getCampaignPerformance(
            ctx.user.id,
            new Date(input.startDate),
            new Date(input.endDate)
          );
        } catch (error) {
          console.error("Error in campaignPerformance:", error);
          // Return empty data instead of throwing
          return {
            overview: {
              totalCampaigns: 0,
              totalSent: 0,
              totalOpened: 0,
              totalClicked: 0,
              totalReplied: 0,
              avgOpenRate: 0,
              avgClickRate: 0,
              avgReplyRate: 0,
            },
            timeline: [],
            topCampaigns: [],
          };
        }
      }),

    // Get lead analytics
    leadAnalytics: protectedProcedure.query(async ({ ctx }) => {
      try {
        const analyticsDb = await import("./analyticsDb");
        return await analyticsDb.getLeadAnalytics(ctx.user.id);
      } catch (error) {
        console.error("Error in leadAnalytics:", error);
        return {
          statusDistribution: [],
          topIndustries: [],
          topLocations: [],
          engagementMetrics: {
            totalLeads: 0,
            contacted: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            unsubscribed: 0,
          },
        };
      }
    }),

    // Get sequence analytics
    sequenceAnalytics: protectedProcedure.query(async ({ ctx }) => {
      try {
        const analyticsDb = await import("./analyticsDb");
        return await analyticsDb.getSequenceAnalytics(ctx.user.id);
      } catch (error) {
        console.error("Error in sequenceAnalytics:", error);
        return {
          overview: {
            totalSequences: 0,
            totalEnrolled: 0,
            totalCompleted: 0,
            avgCompletionRate: 0,
          },
          sequencePerformance: [],
        };
      }
    }),

    // Get engagement heatmap
    engagementHeatmap: protectedProcedure.query(async ({ ctx }) => {
      try {
        const analyticsDb = await import("./analyticsDb");
        return await analyticsDb.getEngagementHeatmap(ctx.user.id);
      } catch (error) {
        console.error("Error in engagementHeatmap:", error);
        return {
          hourly: [],
          daily: [],
        };
      }
    }),

    // Get top performers
    topPerformers: protectedProcedure.query(async ({ ctx }) => {
      try {
        const analyticsDb = await import("./analyticsDb");
        return await analyticsDb.getTopPerformers(ctx.user.id);
      } catch (error) {
        console.error("Error in topPerformers:", error);
        return {
          topCampaigns: [],
          topIndustries: [],
        };
      }
    }),
  }),

  // ============================================
  // QUEUE ROUTER
  // ============================================
  // USER ROUTER
  // ============================================
  user: router({
    // Get user usage stats
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const usage = await db.getUserUsageStats(ctx.user.id);
      return usage;
    }),

    // Get subscription info
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      if (!subscription) {
        return {
          plan: "free",
          status: "active",
          currentPeriodEnd: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        };
      }

      return {
        plan: subscription.subscriptionPlan || "free",
        status: subscription.subscriptionStatus || "active",
        currentPeriodEnd: subscription.subscriptionPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      };
    }),
  }),

  // ============================================
  // STRIPE ROUTER
  // ============================================
  stripe: router({
    // Create checkout session for subscription
    createCheckoutSession: protectedProcedure
      .input(
        z.object({
          planId: z.enum(["basic", "pro"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-12-15.clover",
        });
        const { SUBSCRIPTION_PLANS } = await import("@shared/products");

        const plan = SUBSCRIPTION_PLANS.find((p) => p.id === input.planId);
        if (!plan) {
          throw new Error("Invalid plan ID");
        }

        // Get origin from request headers
        const origin = ctx.req.headers.origin || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: plan.stripePriceId,
              quantity: 1,
            },
          ],
          success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing`,
          customer_email: ctx.user.email,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email,
            customer_name: ctx.user.name || "",
            plan_id: plan.id,
          },
          allow_promotion_codes: true,
        });

        return { url: session.url! };
      }),

    // Get subscription status
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      if (!subscription || !subscription.subscriptionPlan) {
        return {
          status: "none" as const,
          planId: null,
          currentPeriodEnd: null,
          monthlyLeadsQuota: 0,
          usedLeadsThisMonth: 0,
        };
      }

      return {
        status: subscription.subscriptionStatus || "active",
        planId: subscription.subscriptionPlan,
        currentPeriodEnd: subscription.subscriptionPeriodEnd,
        monthlyLeadsQuota: subscription.monthlyLeadsQuota || 0,
        usedLeadsThisMonth: subscription.usedLeadsThisMonth || 0,
      };
    }),

    // Cancel subscription
    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      if (!subscription?.stripeSubscriptionId) {
        throw new Error("No active subscription found");
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2025-12-15.clover",
      });

      // Cancel at period end (user keeps access until end of billing period)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true, message: "Subscription will be cancelled at end of billing period" };
    }),

    // Create customer portal session (for managing billing)
    createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      if (!subscription?.stripeCustomerId) {
        throw new Error("No Stripe customer found");
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2025-12-15.clover",
      });

      const origin = ctx.req.headers.origin || "http://localhost:3000";

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${origin}/dashboard`,
      });

      return { url: session.url };
    }),

    // Get all subscriptions (admin only)
    getAllSubscriptions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      return await db.getAllSubscriptions();
    }),

    // Get invoices for current user
    getInvoices: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      if (!subscription?.stripeCustomerId) {
        return { invoices: [] };
      }

      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-12-15.clover",
        });

        const invoices = await stripe.invoices.list({
          customer: subscription.stripeCustomerId,
          limit: 12,
        });

        return {
          invoices: invoices.data.map((inv) => ({
            id: inv.id,
            date: new Date(inv.created * 1000).toISOString(),
            amount: (inv.amount_paid || 0) / 100,
            status: inv.status || "unknown",
            pdfUrl: inv.invoice_pdf || undefined,
          })),
        };
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return { invoices: [] };
      }
    }),

    // Reactivate cancelled subscription
    reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      if (!subscription?.stripeSubscriptionId) {
        throw new Error("No subscription found");
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2025-12-15.clover",
      });

      // Remove cancellation
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database
      await db.updateUserSubscription(ctx.user.id, {
        subscriptionStatus: "active",
      });

      return { success: true, message: "Subscription reactivated" };
    }),

    // Change subscription plan (upgrade/downgrade)
    changePlan: protectedProcedure
      .input(
        z.object({
          newPlanId: z.enum(["basic", "pro"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const subscription = await db.getUserSubscription(ctx.user.id);
        
        if (!subscription?.stripeSubscriptionId) {
          throw new Error("No active subscription found");
        }

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-12-15.clover",
        });
        const { SUBSCRIPTION_PLANS } = await import("@shared/products");

        const newPlan = SUBSCRIPTION_PLANS.find((p) => p.id === input.newPlanId);
        if (!newPlan) {
          throw new Error("Invalid plan ID");
        }

        // Get current subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );

        // Update subscription with new price
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: "create_prorations",
        });

        // Update database
        await db.updateUserSubscription(ctx.user.id, {
          subscriptionPlan: input.newPlanId,
        });

        return { success: true, message: `Plan changed to ${newPlan.name}` };
      }),
  }),

  // ============================================
  // SAVED COMPANIES ROUTER
  // ============================================
  savedCompanies: router({
    // Check if company is saved
    checkSaved: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await db.checkCompanySaved(ctx.user.id, input.companyId);
        return { isSaved: result };
      }),

    // Save company
    save: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        listName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.saveCompany({
          userId: ctx.user.id,
          companyId: input.companyId,
          listName: input.listName || 'default',
          notes: input.notes,
        });
      }),

    // Remove saved company
    remove: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeSavedCompany(ctx.user.id, input.companyId);
      }),

    // Get all saved companies
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedCompanies(ctx.user.id);
    }),

    // Get lists
    getLists: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSavedCompanyLists(ctx.user.id);
    }),
  }),

  // ============================================
  // NOTIFICATIONS ROUTER
  // ============================================
  notifications: router({
    // Get all notifications
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getNotifications(ctx.user.id, input.limit || 20);
      }),

    // Get unread count
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

    // Mark as read
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.markNotificationAsRead(input.id, ctx.user.id);
      }),

    // Mark all as read
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.markAllNotificationsAsRead(ctx.user.id);
    }),

    // Delete notification
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteNotification(input.id, ctx.user.id);
      }),
  }),

  // ============================================
  // CALENDAR ROUTER
  // ============================================
  calendar: router({
    // Get all events
    getEvents: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        eventType: z.string().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getCalendarEvents(ctx.user.id, {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          eventType: input.eventType,
          status: input.status,
        });
      }),

    // Get single event
    getEvent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getCalendarEvent(input.id, ctx.user.id);
      }),

    // Create event
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventType: z.enum(['follow_up', 'meeting', 'call', 'task', 'reminder']),
        startTime: z.string(),
        endTime: z.string().optional(),
        allDay: z.boolean().optional(),
        location: z.string().optional(),
        companyId: z.number().optional(),
        leadId: z.number().optional(),
        campaignId: z.number().optional(),
        reminderMinutes: z.number().optional(),
        isRecurring: z.boolean().optional(),
        recurrenceRule: z.string().optional(),
        color: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCalendarEvent({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          eventType: input.eventType,
          startTime: new Date(input.startTime),
          endTime: input.endTime ? new Date(input.endTime) : undefined,
          allDay: input.allDay,
          location: input.location,
          companyId: input.companyId,
          leadId: input.leadId,
          campaignId: input.campaignId,
          reminderMinutes: input.reminderMinutes,
          isRecurring: input.isRecurring,
          recurrenceRule: input.recurrenceRule,
          color: input.color,
          notes: input.notes,
        });
      }),

    // Update event
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        allDay: z.boolean().optional(),
        location: z.string().optional(),
        companyId: z.number().optional(),
        leadId: z.number().optional(),
        campaignId: z.number().optional(),
        status: z.string().optional(),
        reminderMinutes: z.number().optional(),
        color: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return await db.updateCalendarEvent(id, ctx.user.id, {
          ...data,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        });
      }),

    // Delete event
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteCalendarEvent(input.id, ctx.user.id);
      }),

    // Get events count by type
    getCountByType: protectedProcedure.query(async ({ ctx }) => {
      return await db.getEventsCountByType(ctx.user.id);
    }),
  }),

  // ============================================
  // ADMIN ROUTER
  // ============================================
  admin: router({
    // Get admin stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      return await db.getAdminStats();
    }),

    // Get all users
    getUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      return await db.getAllUsers();
    }),

    // Update user role
    updateUserRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.updateUserRole(input.userId, input.role);
      }),

    // Update user plan
    updateUserPlan: protectedProcedure
      .input(z.object({
        userId: z.number(),
        plan: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.updateUserPlan(input.userId, input.plan);
      }),

    // Update user status (activate/deactivate)
    updateUserStatus: protectedProcedure
      .input(z.object({
        userId: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.updateUserStatus(input.userId, input.isActive);
      }),

    // Delete user
    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        if (input.userId === ctx.user.id) {
          throw new Error("Cannot delete your own account");
        }
        return await db.deleteUser(input.userId);
      }),

    // Send email to users
    sendEmail: protectedProcedure
      .input(z.object({
        userIds: z.array(z.number()),
        subject: z.string(),
        body: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        
        // Get users emails
        const users = await db.getAllUsers();
        const targetUsers = users.users.filter(u => input.userIds.includes(u.id));
        
        // Send emails using Resend
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        let sent = 0;
        for (const user of targetUsers) {
          if (user.email) {
            try {
              await resend.emails.send({
                from: "NorskLeads <noreply@nexifyhub.no>",
                to: user.email,
                subject: input.subject,
                html: `<div style="font-family: sans-serif;">
                  <p>Hei ${user.name || ""},</p>
                  <div>${input.body.replace(/\n/g, "<br>")}</div>
                  <br>
                  <p>Med vennlig hilsen,<br>NorskLeads Team</p>
                </div>`,
              });
              sent++;
            } catch (e) {
              console.error(`Failed to send email to ${user.email}:`, e);
            }
          }
        }
        
        return { success: true, sent };
      }),
  }),

  // ============================================
  // EMAIL FINDER ROUTER (Google Maps Scraping)
  // ============================================
  emailFinder: router({
    // Get companies without email
    getCompaniesWithoutEmail: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        fylke: z.string().optional(),
        kommune: z.string().optional(),
        hasWebsite: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getCompaniesWithoutEmail(input);
      }),

    // Find email for a single company
    findEmail: protectedProcedure
      .input(z.object({
        companyId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new Error("Company not found");
        }

        const { findCompanyEmail } = await import("./enrichment/googleMapsEmailFinder");
        
        const result = await findCompanyEmail(
          company.navn,
          company.organisasjonsnummer,
          company.hjemmeside,
          company.telefon,
          company.kommune
        );

        // Update company if email found
        if (result.email) {
          await db.updateCompanyContact(input.companyId, {
            epostadresse: result.email,
            telefon: result.phone || company.telefon,
            hjemmeside: result.website || company.hjemmeside,
          });
        }

        return result;
      }),

    // Batch find emails for multiple companies
    findEmailsBatch: protectedProcedure
      .input(z.object({
        companyIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const companies = await Promise.all(
          input.companyIds.map(id => db.getCompanyById(id))
        );

        const validCompanies = companies.filter(c => c !== null) as NonNullable<typeof companies[0]>[];

        const { findCompanyEmailsBatch } = await import("./enrichment/googleMapsEmailFinder");
        
        const results = await findCompanyEmailsBatch(
          validCompanies.map(c => ({
            navn: c.navn,
            organisasjonsnummer: c.organisasjonsnummer,
            hjemmeside: c.hjemmeside,
            telefon: c.telefon,
            kommune: c.kommune,
          }))
        );

        // Update companies with found emails
        let updated = 0;
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const company = validCompanies[i];
          
          if (result.email) {
            await db.updateCompanyContact(company.id, {
              epostadresse: result.email,
              telefon: result.phone || company.telefon,
              hjemmeside: result.website || company.hjemmeside,
            });
            updated++;
          }
        }

        return {
          total: results.length,
          found: results.filter(r => r.email).length,
          updated,
          results,
        };
      }),

    // Auto-enrich: Find emails for companies without email (background job)
    autoEnrich: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        fylke: z.string().optional(),
        kommune: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can run auto-enrich
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        const companies = await db.getCompaniesWithoutEmail({
          limit: input.limit,
          fylke: input.fylke,
          kommune: input.kommune,
          hasWebsite: true, // Prioritize companies with websites
        });

        const { findCompanyEmailsBatch } = await import("./enrichment/googleMapsEmailFinder");
        
        const results = await findCompanyEmailsBatch(
          companies.map(c => ({
            navn: c.navn,
            organisasjonsnummer: c.organisasjonsnummer,
            hjemmeside: c.hjemmeside,
            telefon: c.telefon,
            kommune: c.kommune,
          })),
          2, // Lower concurrency for background job
          3000 // Longer delay
        );

        // Update companies with found emails
        let updated = 0;
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const company = companies[i];
          
          if (result.email) {
            await db.updateCompanyContact(company.id, {
              epostadresse: result.email,
              telefon: result.phone || company.telefon,
              hjemmeside: result.website || company.hjemmeside,
            });
            updated++;
          }
        }

        // Log activity
        await db.createActivity({
          userId: ctx.user.id,
          type: "email_enrichment",
          description: `Auto-enriched ${updated} companies with emails`,
          metadata: {
            total: results.length,
            found: results.filter(r => r.email).length,
            updated,
          },
        });

        return {
          total: results.length,
          found: results.filter(r => r.email).length,
          updated,
        };
      }),

    // Get enrichment stats
    getStats: protectedProcedure.query(async () => {
      return await db.getEmailEnrichmentStats();
    }),
  }),

  // ============================================
  queue: router({
    // Get queue stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const queueDb = await import("./queueDb");
      return await queueDb.getQueueStats();
    }),

    // Process queue (manual trigger for testing)
    process: protectedProcedure.mutation(async ({ ctx }) => {
      const { requireRole } = await import("./rbac");
      requireRole("admin")(ctx);

      const queueDb = await import("./queueDb");
      return await queueDb.processQueue();
    }),
  }),

  // ============================================
  // LEAD SCORING ROUTER
  // ============================================
  leadScoring: router({
    // Calculate score for a single company
    scoreCompany: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        targetIndustries: z.array(z.string()).optional(),
        targetLocations: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new Error("Company not found");
        }
        const { calculateLeadScore } = await import("./services/leadScoring");
        return calculateLeadScore(company as any, {
          targetIndustries: input.targetIndustries,
          targetLocations: input.targetLocations,
        });
      }),

    // Calculate scores for search results
    scoreSearchResults: protectedProcedure
      .input(z.object({
        companyIds: z.array(z.number()),
        targetIndustries: z.array(z.string()).optional(),
        targetLocations: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const companies = await Promise.all(
          input.companyIds.map(id => db.getCompanyById(id))
        );
        const validCompanies = companies.filter(c => c !== null);
        const { calculateLeadScoresBatch } = await import("./services/leadScoring");
        return calculateLeadScoresBatch(validCompanies as any[], {
          targetIndustries: input.targetIndustries,
          targetLocations: input.targetLocations,
        });
      }),
  }),

  // ============================================
  // AI EMAIL WRITER ROUTER
  // ============================================
  ai: router({
    // Generate email using AI
    generateEmail: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        location: z.string().optional(),
        contactName: z.string().optional(),
        purpose: z.enum(["sales", "partnership", "introduction", "followup", "custom"]),
        customPurpose: z.string().optional(),
        tone: z.enum(["formal", "friendly", "professional"]),
        language: z.enum(["norwegian", "english"]),
        additionalContext: z.string().optional(),
        productOrService: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateEmail } = await import("./services/aiEmailWriter");
        return await generateEmail(input);
      }),

    // Improve existing email
    improveEmail: protectedProcedure
      .input(z.object({
        originalEmail: z.string(),
        instruction: z.string(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { improveEmail } = await import("./services/aiEmailWriter");
        return await improveEmail(input.originalEmail, input.instruction, input.language);
      }),

    // Verify email address
    verifyEmail: protectedProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const { verifyEmail } = await import("./services/emailVerification");
        return await verifyEmail(input.email);
      }),

    // Verify multiple emails
    verifyEmailBatch: protectedProcedure
      .input(z.object({
        emails: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { verifyEmailBatch } = await import("./services/emailVerification");
        return await verifyEmailBatch(input.emails);
      }),

    // Generate subject line variants
    generateSubjects: protectedProcedure
      .input(z.object({
        emailBody: z.string(),
        count: z.number().optional(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateSubjectVariants } = await import("./services/aiEmailWriter");
        return await generateSubjectVariants(input.emailBody, input.count, input.language);
      }),

    // ============================================
    // ADVANCED AI FEATURES
    // ============================================

    // Generate lead insights
    generateLeadInsights: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        location: z.string().optional(),
        employees: z.number().optional(),
        revenue: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        contactName: z.string().optional(),
        contactTitle: z.string().optional(),
        score: z.number().optional(),
        tags: z.array(z.string()).optional(),
        emailHistory: z.array(z.object({
          subject: z.string(),
          status: z.enum(["sent", "opened", "clicked", "replied", "bounced"]),
          date: z.string(),
        })).optional(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateLeadInsights } = await import("./services/aiInsights");
        const { language, ...leadData } = input;
        return await generateLeadInsights(leadData, language || "norwegian");
      }),

    // Generate email sequence
    generateEmailSequence: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        contactName: z.string().optional(),
        goal: z.enum(["nurture", "conversion", "reengagement", "onboarding"]),
        steps: z.number().min(2).max(10).optional(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateEmailSequence } = await import("./services/aiInsights");
        const { goal, steps, language, ...leadData } = input;
        return await generateEmailSequence(leadData, goal, steps, language || "norwegian");
      }),

    // Research company
    researchCompany: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        website: z.string().optional(),
        additionalInfo: z.string().optional(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { researchCompany } = await import("./services/aiInsights");
        return await researchCompany(input.companyName, input.website, input.additionalInfo, input.language || "norwegian");
      }),

    // Analyze email performance
    analyzeEmailPerformance: protectedProcedure
      .input(z.object({
        emails: z.array(z.object({
          subject: z.string(),
          body: z.string(),
          openRate: z.number(),
          clickRate: z.number(),
          replyRate: z.number(),
        })),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeEmailPerformance } = await import("./services/aiInsights");
        return await analyzeEmailPerformance(input.emails, input.language || "norwegian");
      }),

    // Generate personalized outreach
    generatePersonalizedOutreach: protectedProcedure
      .input(z.object({
        companyName: z.string(),
        industry: z.string().optional(),
        contactName: z.string().optional(),
        contactTitle: z.string().optional(),
        trigger: z.string().optional(),
        yourProduct: z.string(),
        valueProposition: z.string(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { generatePersonalizedOutreach } = await import("./services/aiInsights");
        const { yourProduct, valueProposition, trigger, language, ...leadData } = input;
        return await generatePersonalizedOutreach(
          leadData,
          { trigger, yourProduct, valueProposition },
          language || "norwegian"
        );
      }),

    // AI score leads
    aiScoreLeads: protectedProcedure
      .input(z.object({
        leads: z.array(z.object({
          companyName: z.string(),
          industry: z.string().optional(),
          location: z.string().optional(),
          employees: z.number().optional(),
        })),
        idealCustomerProfile: z.string(),
        priorities: z.array(z.string()),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { aiScoreLeads } = await import("./services/aiInsights");
        return await aiScoreLeads(
          input.leads,
          { idealCustomerProfile: input.idealCustomerProfile, priorities: input.priorities },
          input.language || "norwegian"
        );
      }),

    // Chat with AI assistant
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { chatWithAssistant } = await import("./services/aiAssistant");
        return await chatWithAssistant(
          input.messages,
          { userId: ctx.user.id, userName: ctx.user.name || undefined },
          input.language || "norwegian"
        );
      }),

    // Get quick suggestions
    getQuickSuggestions: protectedProcedure
      .input(z.object({
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { getQuickSuggestions } = await import("./services/aiAssistant");
        return await getQuickSuggestions(
          { userId: ctx.user.id, userName: ctx.user.name || undefined },
          input.language || "norwegian"
        );
      }),

    // Analyze conversation
    analyzeConversation: protectedProcedure
      .input(z.object({
        conversation: z.string(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeConversation } = await import("./services/aiAssistant");
        return await analyzeConversation(input.conversation, input.language || "norwegian");
      }),

    // Handle objection
    handleObjection: protectedProcedure
      .input(z.object({
        objection: z.string(),
        product: z.string().optional(),
        industry: z.string().optional(),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { handleObjection } = await import("./services/aiAssistant");
        return await handleObjection(
          input.objection,
          { product: input.product, industry: input.industry },
          input.language || "norwegian"
        );
      }),

    // Generate sales pitch
    generatePitch: protectedProcedure
      .input(z.object({
        product: z.string(),
        targetAudience: z.string(),
        uniqueSellingPoints: z.array(z.string()),
        duration: z.enum(["30s", "60s", "2min"]),
        language: z.enum(["norwegian", "english"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { generatePitch } = await import("./services/aiAssistant");
        return await generatePitch(
          {
            product: input.product,
            targetAudience: input.targetAudience,
            uniqueSellingPoints: input.uniqueSellingPoints,
            duration: input.duration,
          },
          input.language || "norwegian"
        );
      }),
  }),

  // ============================================
  // AI INTEGRATIONS & SETTINGS ROUTER (Admin Only)
  // ============================================
  aiSettings: router({
    // Get all AI integrations
    getIntegrations: protectedProcedure
      .query(async ({ ctx }) => {
        // Admin only
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.getAIIntegrations();
      }),

    // Get enabled integrations (for dropdown selection)
    getEnabledIntegrations: protectedProcedure
      .query(async () => {
        return await db.getEnabledAIIntegrations();
      }),

    // Create AI integration
    createIntegration: protectedProcedure
      .input(z.object({
        provider: z.string(),
        name: z.string(),
        apiKey: z.string().optional(),
        apiEndpoint: z.string().optional(),
        model: z.string().optional(),
        isEnabled: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        settings: z.record(z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.createAIIntegration(input);
      }),

    // Update AI integration
    updateIntegration: protectedProcedure
      .input(z.object({
        id: z.number(),
        provider: z.string().optional(),
        name: z.string().optional(),
        apiKey: z.string().optional(),
        apiEndpoint: z.string().optional(),
        model: z.string().optional(),
        isEnabled: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        settings: z.record(z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        const { id, ...data } = input;
        return await db.updateAIIntegration(id, data);
      }),

    // Delete AI integration
    deleteIntegration: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.deleteAIIntegration(input.id);
      }),

    // Test AI integration
    testIntegration: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.testAIIntegration(input.id);
      }),

    // Get system settings
    getSettings: protectedProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        const settings = await db.getSystemSettings(input?.category);
        // Mask secret values
        return settings.map(s => ({
          ...s,
          value: s.isSecret ? '••••••••' : s.value,
        }));
      }),

    // Set system setting
    setSetting: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        isSecret: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.setSystemSetting({
          ...input,
          updatedBy: ctx.user.id,
        });
      }),

    // Delete system setting
    deleteSetting: protectedProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Unauthorized: Admin access required");
        }
        return await db.deleteSystemSetting(input.key);
      }),

    // Get available AI providers list
    getProviders: protectedProcedure
      .query(async () => {
        return [
          { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
          { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
          { id: 'google', name: 'Google AI', models: ['gemini-pro', 'gemini-pro-vision'] },
          { id: 'azure', name: 'Azure OpenAI', models: ['gpt-4', 'gpt-35-turbo'] },
          { id: 'hunter', name: 'Hunter.io', models: [], description: 'Email finder & verification' },
          { id: 'clearbit', name: 'Clearbit', models: [], description: 'Company enrichment' },
          { id: 'apollo', name: 'Apollo.io', models: [], description: 'Lead enrichment' },
          { id: 'brreg', name: 'Brønnøysundregistrene', models: [], description: 'Norwegian Business Registry' },
        ];
      }),
  }),

  // ============================================
  // BRREG INTEGRATION ROUTER
  // ============================================
  brreg: router({
    // Check if Brreg is enabled
    isEnabled: protectedProcedure
      .query(async () => {
        const setting = await db.getSystemSetting('brreg_enabled');
        return setting?.value !== 'false'; // Default to enabled
      }),

    // Search companies in Brreg
    search: protectedProcedure
      .input(z.object({
        navn: z.string().optional(),
        organisasjonsnummer: z.string().optional(),
        kommunenummer: z.string().optional(),
        organisasjonsform: z.string().optional(),
        naeringskode: z.string().optional(),
        fraAntallAnsatte: z.number().optional(),
        tilAntallAnsatte: z.number().optional(),
        konkurs: z.boolean().optional(),
        size: z.number().optional().default(20),
        page: z.number().optional().default(0),
      }))
      .query(async ({ input }) => {
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }
        const { searchBrregCompanies } = await import('./services/brregIntegration');
        return await searchBrregCompanies(input);
      }),

    // Get company details from Brreg
    getCompany: protectedProcedure
      .input(z.object({ orgNr: z.string() }))
      .query(async ({ input }) => {
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }
        const { getBrregCompany } = await import('./services/brregIntegration');
        return await getBrregCompany(input.orgNr);
      }),

    // Get company roles/management from Brreg
    getCompanyRoles: protectedProcedure
      .input(z.object({ orgNr: z.string() }))
      .query(async ({ input }) => {
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }
        const { getBrregCompanyRoles, extractCEO, extractBoardMembers } = await import('./services/brregIntegration');
        const roles = await getBrregCompanyRoles(input.orgNr);
        return {
          rollegrupper: roles,
          ceo: extractCEO(roles),
          boardMembers: extractBoardMembers(roles),
        };
      }),

    // Enrich company data from Brreg (get all info + roles)
    enrichCompany: protectedProcedure
      .input(z.object({ orgNr: z.string() }))
      .query(async ({ input }) => {
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }
        const { enrichCompanyFromBrreg } = await import('./services/brregIntegration');
        return await enrichCompanyFromBrreg(input.orgNr);
      }),

    // Update local company with Brreg data
    syncCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input }) => {
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }
        const { enrichCompanyFromBrreg } = await import('./services/brregIntegration');
        
        // Get local company
        const localCompany = await db.getCompanyById(input.companyId);
        if (!localCompany || !localCompany.organisasjonsnummer) {
          throw new Error('Company not found or missing org number');
        }

        // Get Brreg data
        const brregData = await enrichCompanyFromBrreg(localCompany.organisasjonsnummer);
        if (!brregData) {
          throw new Error('Company not found in Brreg');
        }

        // Update local company
        await db.updateCompanyFromBrreg(input.companyId, {
          navn: brregData.company.navn,
          hjemmeside: brregData.company.hjemmeside,
          epostadresse: brregData.company.epostadresse,
          telefon: brregData.company.telefon,
          forretningsadresse: brregData.company.forretningsadresse,
          poststed: brregData.company.poststed,
          postnummer: brregData.company.postnummer,
          kommune: brregData.company.kommune,
          antallAnsatte: brregData.company.antallAnsatte,
          dagligLeder: brregData.ceo?.navn || null,
        });

        return {
          success: true,
          company: brregData.company,
          ceo: brregData.ceo,
          boardMembers: brregData.boardMembers,
        };
      }),

    // Bulk sync companies with Brreg
    bulkSync: protectedProcedure
      .input(z.object({
        companyIds: z.array(z.number()).optional(),
        limit: z.number().optional().default(50),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }

        const { enrichCompanyFromBrreg } = await import('./services/brregIntegration');
        
        // Get companies to sync
        let companies;
        if (input.companyIds && input.companyIds.length > 0) {
          companies = await Promise.all(
            input.companyIds.slice(0, input.limit).map(id => db.getCompanyById(id))
          );
          companies = companies.filter(c => c !== null);
        } else {
          // Get companies that need updating (no recent brreg sync)
          companies = await db.getCompaniesNeedingBrregSync(input.limit);
        }

        const results = {
          total: companies.length,
          success: 0,
          failed: 0,
          updated: [] as { id: number; navn: string }[],
          errors: [] as { id: number; error: string }[],
        };

        for (const company of companies) {
          if (!company?.organisasjonsnummer) {
            results.failed++;
            results.errors.push({ id: company?.id || 0, error: 'Missing org number' });
            continue;
          }

          try {
            const brregData = await enrichCompanyFromBrreg(company.organisasjonsnummer);
            if (brregData) {
              await db.updateCompanyFromBrreg(company.id, {
                navn: brregData.company.navn,
                hjemmeside: brregData.company.hjemmeside,
                epostadresse: brregData.company.epostadresse,
                telefon: brregData.company.telefon,
                forretningsadresse: brregData.company.forretningsadresse,
                poststed: brregData.company.poststed,
                postnummer: brregData.company.postnummer,
                kommune: brregData.company.kommune,
                antallAnsatte: brregData.company.antallAnsatte,
                dagligLeder: brregData.ceo?.navn || null,
              });
              results.success++;
              results.updated.push({ id: company.id, navn: brregData.company.navn });
            } else {
              results.failed++;
              results.errors.push({ id: company.id, error: 'Not found in Brreg' });
            }
          } catch (error: any) {
            results.failed++;
            results.errors.push({ id: company.id, error: error.message });
          }

          // Rate limiting - wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
      }),

    // Get recent updates from Brreg
    getUpdates: protectedProcedure
      .input(z.object({
        dato: z.string().optional(),
        size: z.number().optional().default(100),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }
        const { getBrregUpdates } = await import('./services/brregIntegration');
        return await getBrregUpdates(input);
      }),

    // Import new companies from Brreg search
    importFromSearch: protectedProcedure
      .input(z.object({
        navn: z.string().optional(),
        kommunenummer: z.string().optional(),
        organisasjonsform: z.string().optional(),
        naeringskode: z.string().optional(),
        fraAntallAnsatte: z.number().optional(),
        tilAntallAnsatte: z.number().optional(),
        size: z.number().optional().default(100),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        // Check if Brreg is enabled
        const setting = await db.getSystemSetting('brreg_enabled');
        if (setting?.value === 'false') {
          throw new Error('Brreg-integrasjonen er deaktivert. Aktiver den i AI-innstillinger.');
        }

        const { searchAndImportFromBrreg } = await import('./services/brregIntegration');
        const result = await searchAndImportFromBrreg(input);

        // Import companies to database
        let imported = 0;
        let skipped = 0;
        
        for (const company of result.companies) {
          try {
            // Check if already exists
            const existing = await db.getCompanyByOrgNr(company.organisasjonsnummer);
            if (existing) {
              skipped++;
              continue;
            }

            // Insert new company
            await db.insertCompanyFromBrreg(company);
            imported++;
          } catch (error) {
            console.error('Error importing company:', error);
          }
        }

        return {
          total: result.total,
          fetched: result.companies.length,
          imported,
          skipped,
        };
       }),
  }),

  // ============================================
  // ACTIVITY LOG ROUTER
  // ============================================
  activityLog: router({
    // Get activity logs
    getLogs: protectedProcedure
      .input(z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        action: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Regular users can only see their own logs
        const userId = ctx.user?.role === 'admin' ? undefined : ctx.user?.id;
        
        return await db.getActivityLogs({
          userId,
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          limit: input.limit,
          offset: input.offset,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
      }),

    // Get all logs (admin only)
    getAllLogs: protectedProcedure
      .input(z.object({
        userId: z.number().optional(),
        entityType: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        return await db.getActivityLogs({
          userId: input.userId,
          entityType: input.entityType,
          action: input.action,
          limit: input.limit,
          offset: input.offset,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
      }),

    // Get activity stats
    getStats: protectedProcedure
      .input(z.object({
        days: z.number().optional().default(30),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.role === 'admin' ? undefined : ctx.user?.id;
        return await db.getActivityLogStats(userId, input.days);
      }),
  }),

  // ============================================
  // REFERRAL ROUTER
  // ============================================
  referral: router({
    // Get or create referral stats for current user
    getMyStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrCreateReferralStats(ctx.user.id);
    }),

    // Get all referrals made by current user
    getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
      return await db.getReferralsByUser(ctx.user.id);
    }),

    // Send referral invite
    sendInvite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create referral invite
        const referral = await db.createReferralInvite(ctx.user.id, input.email);
        
        // Log activity
        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'referral_sent',
          entityType: 'referral',
          entityId: (referral as any).id,
          details: { email: input.email },
        });

        return referral;
      }),

    // Claim reward for a referral
    claimReward: protectedProcedure
      .input(z.object({
        referralId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.claimReferralReward(ctx.user.id, input.referralId);
        if (!result) {
          throw new Error('Referral not found or already claimed');
        }
        
        // Log activity
        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'reward_claimed',
          entityType: 'referral',
          entityId: input.referralId,
          details: { rewardAmount: result.reward_amount },
        });

        return result;
      }),

    // Validate referral code (public - for signup page)
    validateCode: publicProcedure
      .input(z.object({
        code: z.string(),
      }))
      .query(async ({ input }) => {
        const referral = await db.findReferralByCode(input.code);
        return {
          valid: !!referral,
          code: input.code,
        };
      }),

    // Admin: Get all referral stats
    getAllStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      const dbInstance = await db.getDb();
      const result = await dbInstance.execute(`
        SELECT 
          rs.*,
          u.name as user_name,
          u.email as user_email
        FROM referral_stats rs
        JOIN users u ON rs.user_id = u.id
        ORDER BY rs.total_signups DESC
      `);
      return result.rows;
    }),
  }),

  // ============================================
  // A/B TESTING ROUTER
  // ============================================
  abTests: router({
    // Get all A/B tests for user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAbTests(ctx.user.id);
    }),

    // Get single A/B test with variants
    getById: protectedProcedure
      .input(z.object({ testId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getAbTestById(input.testId, ctx.user.id);
      }),

    // Create new A/B test
    create: protectedProcedure
      .input(z.object({
        campaignId: z.number(),
        name: z.string(),
        testType: z.enum(['subject', 'content', 'sender', 'send_time']),
        sampleSize: z.number().min(5).max(50).default(20),
        winningCriteria: z.enum(['open_rate', 'click_rate', 'reply_rate']).default('open_rate'),
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
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createAbTest({
          ...input,
          userId: ctx.user.id,
        });
        
        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'create',
          entityType: 'ab_test',
          entityId: result.id,
          details: { name: input.name, testType: input.testType },
        });
        
        return result;
      }),

    // Start A/B test
    start: protectedProcedure
      .input(z.object({ testId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.startAbTest(input.testId, ctx.user.id);
      }),

    // Select winner manually
    selectWinner: protectedProcedure
      .input(z.object({
        testId: z.number(),
        winnerId: z.enum(['A', 'B']),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.selectAbTestWinner(input.testId, ctx.user.id, input.winnerId);
      }),
  }),

  // ============================================
  // ADVANCED LEAD SCORING ROUTER
  // ============================================
  leadScoringAdvanced: router({
    // Get lead scores for user
    getScores: protectedProcedure
      .input(z.object({
        tier: z.enum(['cold', 'warm', 'hot', 'very_hot']).optional(),
        minScore: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getLeadScores(ctx.user.id, input);
      }),

    // Get scoring rules
    getRules: protectedProcedure.query(async ({ ctx }) => {
      return await db.getScoringRules(ctx.user.id);
    }),

    // Create scoring rule
    createRule: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        ruleType: z.enum(['engagement', 'company_attribute', 'behavior']),
        condition: z.string(),
        operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'not_equals']),
        value: z.string(),
        scoreChange: z.number(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createScoringRule({
          ...input,
          userId: ctx.user.id,
        });
      }),

    // Update scoring rule
    updateRule: protectedProcedure
      .input(z.object({
        ruleId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        condition: z.string().optional(),
        operator: z.string().optional(),
        value: z.string().optional(),
        scoreChange: z.number().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ruleId, ...data } = input;
        return await db.updateScoringRule(ruleId, ctx.user.id, data);
      }),

    // Delete scoring rule
    deleteRule: protectedProcedure
      .input(z.object({ ruleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteScoringRule(input.ruleId, ctx.user.id);
      }),

    // Manually update lead score
    updateScore: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        scoreChange: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateLeadScore(input.leadId, input.scoreChange, input.reason);
      }),
  }),

  // ============================================
  // WEBHOOKS ROUTER
  // ============================================
  webhooks: router({
    // Get all webhooks for user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWebhooks(ctx.user.id);
    }),

    // Get single webhook
    getById: protectedProcedure
      .input(z.object({ webhookId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getWebhookById(input.webhookId, ctx.user.id);
      }),

    // Create webhook
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        url: z.string().url(),
        secret: z.string().optional(),
        events: z.array(z.enum([
          'lead.created', 'lead.updated', 'lead.deleted',
          'campaign.created', 'campaign.sent', 'campaign.completed',
          'email.opened', 'email.clicked', 'email.replied', 'email.bounced',
          'subscription.created', 'subscription.cancelled',
        ])),
        customHeaders: z.record(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createWebhook({
          ...input,
          userId: ctx.user.id,
        });
        
        await db.createActivityLog({
          userId: ctx.user.id,
          action: 'create',
          entityType: 'webhook',
          entityId: result.id,
          details: { name: input.name, url: input.url },
        });
        
        return result;
      }),

    // Update webhook
    update: protectedProcedure
      .input(z.object({
        webhookId: z.number(),
        name: z.string().optional(),
        url: z.string().url().optional(),
        secret: z.string().optional(),
        isActive: z.boolean().optional(),
        events: z.array(z.string()).optional(),
        customHeaders: z.record(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { webhookId, ...data } = input;
        return await db.updateWebhook(webhookId, ctx.user.id, data);
      }),

    // Delete webhook
    delete: protectedProcedure
      .input(z.object({ webhookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteWebhook(input.webhookId, ctx.user.id);
      }),

    // Get webhook deliveries
    getDeliveries: protectedProcedure
      .input(z.object({
        webhookId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getWebhookDeliveries(input.webhookId, ctx.user.id, input.limit);
      }),

    // Test webhook
    test: protectedProcedure
      .input(z.object({ webhookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const webhook = await db.getWebhookById(input.webhookId, ctx.user.id);
        if (!webhook) throw new Error('Webhook not found');
        
        // Send test event
        await db.dispatchWebhookEvent('test', {
          message: 'This is a test webhook delivery',
          timestamp: new Date().toISOString(),
          userId: ctx.user.id,
        });
        
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
