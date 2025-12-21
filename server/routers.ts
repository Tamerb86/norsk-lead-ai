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
        const analyticsDb = await import("./analyticsDb");
        return await analyticsDb.getCampaignPerformance(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    // Get lead analytics
    leadAnalytics: protectedProcedure.query(async ({ ctx }) => {
      const analyticsDb = await import("./analyticsDb");
      return await analyticsDb.getLeadAnalytics(ctx.user.id);
    }),

    // Get sequence analytics
    sequenceAnalytics: protectedProcedure.query(async ({ ctx }) => {
      const analyticsDb = await import("./analyticsDb");
      return await analyticsDb.getSequenceAnalytics(ctx.user.id);
    }),

    // Get engagement heatmap
    engagementHeatmap: protectedProcedure.query(async ({ ctx }) => {
      const analyticsDb = await import("./analyticsDb");
      return await analyticsDb.getEngagementHeatmap(ctx.user.id);
    }),

    // Get top performers
    topPerformers: protectedProcedure.query(async ({ ctx }) => {
      const analyticsDb = await import("./analyticsDb");
      return await analyticsDb.getTopPerformers(ctx.user.id);
    }),
  }),

  // ============================================
  // QUEUE ROUTER
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
      // TODO: Implement subscription status retrieval from database
      return {
        status: "none" as const,
        planId: null,
        currentPeriodEnd: null,
      };
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
});

export type AppRouter = typeof appRouter;
