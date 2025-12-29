import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, json, date, index, serial } from "drizzle-orm/pg-core";

// Define enums for PostgreSQL
export const roleEnum = pgEnum("role", ["admin", "manager", "viewer"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "scheduled", "sending", "sent", "paused", "completed"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "pending", "sent", "delivered", "opened", "clicked", "replied",
  "interested", "not_interested", "bounced", "unsubscribed"
]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "declined", "expired"]);
export const dataUpdateTypeEnum = pgEnum("data_update_type", ["manual", "automatic"]);
export const dataUpdateStatusEnum = pgEnum("data_update_status", ["started", "completed", "failed"]);
export const emailEventTypeEnum = pgEnum("email_event_type", ["open", "click", "bounce", "unsubscribe", "reply"]);
export const sequenceStatusEnum = pgEnum("sequence_status", ["active", "paused", "archived"]);
export const triggerTypeEnum = pgEnum("trigger_type", ["time", "opened", "clicked", "replied", "not_opened", "not_replied"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "paused", "completed", "stopped", "bounced"]);
export const emailQueueStatusEnum = pgEnum("email_queue_status", ["pending", "sending", "sent", "failed", "cancelled"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  teamId: integer("teamId"),
  subscriptionPlan: varchar("subscriptionPlan", { length: 50 }),
  monthlyLeadsQuota: integer("monthlyLeadsQuota"),
  usedLeadsThisMonth: integer("usedLeadsThisMonth"),
  passwordHash: varchar("password_hash", { length: 255 }),
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }),
  subscriptionPeriodEnd: timestamp("subscription_period_end"),
  isActive: boolean("is_active").default(true).notNull(),
  // Two-Factor Authentication fields
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  twoFactorBackupCodes: text("two_factor_backup_codes"), // JSON array of hashed backup codes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Teams table
 */
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: integer("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Team invitations
 */
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("teamId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  invitedBy: integer("invitedBy").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

/**
 * Norwegian companies database
 */
export const norwegianCompanies = pgTable("norwegian_companies", {
  id: serial("id").primaryKey(),
  organisasjonsnummer: varchar("organisasjonsnummer", { length: 9 }).notNull().unique(),
  navn: varchar("navn", { length: 500 }).notNull(),
  organisasjonsform: varchar("organisasjonsform", { length: 50 }),
  naeringskode1: varchar("naeringskode1", { length: 10 }),
  naeringsbeskrivelse1: text("naeringsbeskrivelse1"),
  naeringskode2: varchar("naeringskode2", { length: 10 }),
  naeringsbeskrivelse2: text("naeringsbeskrivelse2"),
  antallAnsatte: integer("antallAnsatte"),
  forretningsadresse: text("forretningsadresse"),
  poststed: varchar("poststed", { length: 100 }),
  postnummer: varchar("postnummer", { length: 4 }),
  kommune: varchar("kommune", { length: 100 }),
  fylke: varchar("fylke", { length: 100 }),
  epostadresse: varchar("epostadresse", { length: 255 }),
  telefon: varchar("telefon", { length: 20 }),
  hjemmeside: varchar("hjemmeside", { length: 500 }),
  stiftelsesdato: date("stiftelsesdato"),
  registreringsdato: date("registreringsdato"),
  konkurs: boolean("konkurs").default(false).notNull(),
  underAvvikling: boolean("underAvvikling").default(false).notNull(),
  underTvangsavviklingEllerTvangsopplosning: boolean("underTvangsavviklingEllerTvangsopplosning").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  fylkeIdx: index("fylke_idx").on(table.fylke),
  kommuneIdx: index("kommune_idx").on(table.kommune),
  naeringskode1Idx: index("naeringskode1_idx").on(table.naeringskode1),
  orgnrIdx: index("orgnr_idx").on(table.organisasjonsnummer),
  navnIdx: index("navn_idx").on(table.navn),
}));

/**
 * Email campaigns
 */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  emailSubject: text("emailSubject"),
  emailBody: text("emailBody"),
  emailTemplateId: integer("emailTemplateId"),
  senderName: varchar("senderName", { length: 255 }),
  senderEmail: varchar("senderEmail", { length: 255 }),
  replyTo: varchar("replyTo", { length: 255 }),
  totalRecipients: integer("totalRecipients").default(0).notNull(),
  totalSent: integer("totalSent").default(0).notNull(),
  totalDelivered: integer("totalDelivered").default(0).notNull(),
  totalOpened: integer("totalOpened").default(0).notNull(),
  totalClicked: integer("totalClicked").default(0).notNull(),
  totalReplied: integer("totalReplied").default(0).notNull(),
  totalBounced: integer("totalBounced").default(0).notNull(),
  totalUnsubscribed: integer("totalUnsubscribed").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Campaign leads (recipients)
 */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  companyId: integer("company_id").notNull(),
  trackingId: varchar("trackingId", { length: 64 }),
  unsubscribed: boolean("unsubscribed").default(false).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  emailSentAt: timestamp("emailSentAt"),
  emailDeliveredAt: timestamp("emailDeliveredAt"),
  emailOpenedAt: timestamp("emailOpenedAt"),
  emailClickedAt: timestamp("emailClickedAt"),
  emailRepliedAt: timestamp("emailRepliedAt"),
  emailBouncedAt: timestamp("emailBouncedAt"),
  emailUnsubscribedAt: timestamp("emailUnsubscribedAt"),
  openCount: integer("openCount").default(0).notNull(),
  clickCount: integer("clickCount").default(0).notNull(),
  followUpCount: integer("followUpCount").default(0).notNull(),
  lastFollowUpAt: timestamp("lastFollowUpAt"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  notes: text("notes"),
  replyContent: text("replyContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Email templates
 */
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 50 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Activity log
 */
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("teamId"),
  leadId: integer("leadId"),
  campaignId: integer("campaignId"),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Data update logs (for tracking company data updates)
 */
export const dataUpdateLogs = pgTable("data_update_logs", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  companiesAdded: integer("companiesAdded").default(0).notNull(),
  companiesUpdated: integer("companiesUpdated").default(0).notNull(),
  companiesDeleted: integer("companiesDeleted").default(0).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Saved search filters
 */
export const savedFilters = pgTable("saved_filters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  filters: json("filters").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Email tracking events (opens, clicks, bounces, unsubscribes)
 */
export const emailEvents = pgTable("email_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  trackingId: varchar("trackingId", { length: 64 }).notNull(),
  eventType: varchar("eventType", { length: 20 }).notNull(),
  linkUrl: text("linkUrl"),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;

/**
 * Email Sequences (multi-step automated campaigns)
 */
export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  teamId: integer("teamId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  totalSteps: integer("totalSteps").default(0).notNull(),
  totalEnrolled: integer("totalEnrolled").default(0).notNull(),
  totalCompleted: integer("totalCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Sequence Steps (individual emails in a sequence)
 */
export const sequenceSteps = pgTable("sequence_steps", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").notNull(),
  stepNumber: integer("stepNumber").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  delayDays: integer("delayDays").default(0).notNull(),
  delayHours: integer("delayHours").default(0).notNull(),
  triggerType: varchar("triggerType", { length: 20 }).notNull().default("time"),
  stopOnReply: integer("stopOnReply").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Sequence Enrollments (tracks leads in sequences)
 */
export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").notNull(),
  leadId: integer("lead_id").notNull(),
  currentStep: integer("currentStep").default(0).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  completedAt: timestamp("completedAt"),
  stoppedReason: varchar("stoppedReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Email Queue (scheduled email sends)
 */
export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  campaignId: integer("campaign_id"),
  sequenceId: integer("sequence_id"),
  sequenceStepId: integer("sequence_step_id"),
  enrollmentId: integer("enrollment_id"),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  attempts: integer("attempts").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});


/**
 * Saved Companies (user's favorite/saved companies for later)
 */
export const savedCompanies = pgTable("saved_companies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyId: integer("company_id").notNull(),
  listName: varchar("listName", { length: 100 }).default("default"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedCompany = typeof savedCompanies.$inferSelect;
export type InsertSavedCompany = typeof savedCompanies.$inferInsert;

/**
 * User Notifications (smart notifications for email events)
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // email_opened, email_replied, email_clicked, campaign_completed
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedId: integer("relatedId"), // campaignId, leadId, etc.
  relatedType: varchar("relatedType", { length: 50 }), // campaign, lead, sequence
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User Onboarding Progress
 */
export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  completedSteps: json("completedSteps").default([]).notNull(), // Array of completed step IDs
  currentStep: integer("currentStep").default(1).notNull(),
  tourCompleted: boolean("tourCompleted").default(false).notNull(),
  tourSkipped: boolean("tourSkipped").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserOnboarding = typeof userOnboarding.$inferInsert;


/**
 * Refresh tokens table for JWT rotation
 */
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type InsertRefreshToken = typeof refreshTokens.$inferInsert;


/**
 * AI Integrations - Store API keys and settings for AI services
 */
export const aiIntegrations = pgTable("ai_integrations", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(), // openai, anthropic, google, hunter, etc.
  name: varchar("name", { length: 100 }).notNull(), // Display name
  apiKey: varchar("api_key", { length: 500 }), // Encrypted API key
  apiEndpoint: varchar("api_endpoint", { length: 500 }), // Custom endpoint URL
  model: varchar("model", { length: 100 }), // Default model to use
  isEnabled: boolean("is_enabled").default(false).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  settings: json("settings"), // Additional provider-specific settings
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AIIntegration = typeof aiIntegrations.$inferSelect;
export type InsertAIIntegration = typeof aiIntegrations.$inferInsert;

/**
 * System Settings - Global configuration
 */
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: varchar("category", { length: 50 }), // ai, email, security, etc.
  isSecret: boolean("is_secret").default(false).notNull(), // Should value be masked in UI
  updatedBy: integer("updated_by"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;


/**
 * Calendar Events - Schedule follow-ups and appointments
 */
export const calendarEventTypeEnum = pgEnum("calendar_event_type", ["follow_up", "meeting", "call", "task", "reminder"]);

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull().default("follow_up"), // follow_up, meeting, call, task, reminder
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  allDay: boolean("all_day").default(false).notNull(),
  location: varchar("location", { length: 255 }),
  // Related entities
  companyId: integer("company_id"),
  leadId: integer("lead_id"),
  campaignId: integer("campaign_id"),
  // Status and reminders
  status: varchar("status", { length: 50 }).default("scheduled").notNull(), // scheduled, completed, cancelled
  reminderMinutes: integer("reminder_minutes").default(30), // Minutes before event to send reminder
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  // Recurrence
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrenceRule: varchar("recurrence_rule", { length: 255 }), // RRULE format
  parentEventId: integer("parent_event_id"), // For recurring event instances
  // Metadata
  color: varchar("color", { length: 20 }).default("#6366f1"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;


// Activity Logs - Track user actions
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create", "update", "delete", "view", "export", "login"
  entityType: varchar("entity_type", { length: 50 }).notNull(), // e.g., "company", "lead", "campaign", "template", "user"
  entityId: integer("entity_id"), // ID of the affected entity
  entityName: varchar("entity_name", { length: 255 }), // Name/title for display
  // Additional context
  details: text("details"), // JSON string with additional details
  oldValues: text("old_values"), // JSON string of previous values (for updates)
  newValues: text("new_values"), // JSON string of new values (for updates)
  // Request info
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
