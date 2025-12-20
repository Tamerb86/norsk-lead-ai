import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, date, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "viewer"]).default("admin").notNull(),
  teamId: int("teamId"), // Team membership
  // Subscription fields (existing in DB, preserving for compatibility)
  subscriptionPlan: varchar("subscriptionPlan", { length: 50 }),
  monthlyLeadsQuota: int("monthlyLeadsQuota"),
  usedLeadsThisMonth: int("usedLeadsThisMonth"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Teams table
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(), // User who created the team
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Team invitations
 */
export const teamInvitations = mysqlTable("team_invitations", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["admin", "manager", "viewer"]).notNull(),
  invitedBy: int("invitedBy").notNull(), // User ID who sent the invitation
  status: mysqlEnum("status", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(), // Unique invitation token
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

/**
 * Norwegian companies database
 */
export const norwegianCompanies = mysqlTable("norwegian_companies", {
  id: int("id").autoincrement().primaryKey(),
  organisasjonsnummer: varchar("organisasjonsnummer", { length: 9 }).notNull().unique(),
  navn: varchar("navn", { length: 500 }).notNull(),
  organisasjonsform: varchar("organisasjonsform", { length: 50 }),
  naeringskode1: varchar("naeringskode1", { length: 10 }),
  naeringsbeskrivelse1: text("naeringsbeskrivelse1"),
  naeringskode2: varchar("naeringskode2", { length: 10 }),
  naeringsbeskrivelse2: text("naeringsbeskrivelse2"),
  antallAnsatte: int("antallAnsatte"),
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Performance indexes for common search queries
  fylkeIdx: index("fylke_idx").on(table.fylke),
  kommuneIdx: index("kommune_idx").on(table.kommune),
  naeringskode1Idx: index("naeringskode1_idx").on(table.naeringskode1),
  orgnrIdx: index("orgnr_idx").on(table.organisasjonsnummer),
  navnIdx: index("navn_idx").on(table.navn),
}));

/**
 * Email campaigns
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "paused", "completed"]).default("draft").notNull(),
  emailSubject: text("emailSubject"),
  emailBody: text("emailBody"),
  emailTemplateId: int("emailTemplateId"),
  senderName: varchar("senderName", { length: 255 }),
  senderEmail: varchar("senderEmail", { length: 255 }),
  replyTo: varchar("replyTo", { length: 255 }),
  totalRecipients: int("totalRecipients").default(0).notNull(),
  totalSent: int("totalSent").default(0).notNull(),
  totalDelivered: int("totalDelivered").default(0).notNull(),
  totalOpened: int("totalOpened").default(0).notNull(),
  totalClicked: int("totalClicked").default(0).notNull(),
  totalReplied: int("totalReplied").default(0).notNull(),
  totalBounced: int("totalBounced").default(0).notNull(),
  totalUnsubscribed: int("totalUnsubscribed").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Campaign leads (recipients)
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId").notNull(),
  companyId: int("companyId").notNull(),
  trackingId: varchar("trackingId", { length: 64 }), // Unique tracking ID for email events
  unsubscribed: boolean("unsubscribed").default(false).notNull(), // Unsubscribe status
  status: mysqlEnum("status", [
    "pending",
    "sent",
    "delivered",
    "opened",
    "clicked",
    "replied",
    "interested",
    "not_interested",
    "bounced",
    "unsubscribed",
  ]).default("pending").notNull(),
  emailSentAt: timestamp("emailSentAt"),
  emailDeliveredAt: timestamp("emailDeliveredAt"),
  emailOpenedAt: timestamp("emailOpenedAt"),
  emailClickedAt: timestamp("emailClickedAt"),
  emailRepliedAt: timestamp("emailRepliedAt"),
  emailBouncedAt: timestamp("emailBouncedAt"),
  emailUnsubscribedAt: timestamp("emailUnsubscribedAt"),
  openCount: int("openCount").default(0).notNull(),
  clickCount: int("clickCount").default(0).notNull(),
  followUpCount: int("followUpCount").default(0).notNull(),
  lastFollowUpAt: timestamp("lastFollowUpAt"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  notes: text("notes"),
  replyContent: text("replyContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Email templates
 */
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 50 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Activity log
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId"), // Team context for activity
  leadId: int("leadId"),
  campaignId: int("campaignId"),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Data update logs (for tracking company data updates)
 */
export const dataUpdateLogs = mysqlTable("data_update_logs", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["manual", "automatic"]).notNull(),
  status: mysqlEnum("status", ["started", "completed", "failed"]).notNull(),
  companiesAdded: int("companiesAdded").default(0).notNull(),
  companiesUpdated: int("companiesUpdated").default(0).notNull(),
  companiesDeleted: int("companiesDeleted").default(0).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Saved search filters
 */
export const savedFilters = mysqlTable("saved_filters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  filters: json("filters").notNull(), // Store all filter criteria as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Email tracking events (opens, clicks, bounces, unsubscribes)
 */
export const emailEvents = mysqlTable("email_events", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  campaignId: int("campaignId").notNull(),
  trackingId: varchar("trackingId", { length: 64 }).notNull(),
  eventType: mysqlEnum("eventType", ["open", "click", "bounce", "unsubscribe", "reply"]).notNull(),
  linkUrl: text("linkUrl"), // For click events
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  metadata: json("metadata"), // Additional event data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;


/**
 * Email Sequences (multi-step automated campaigns)
 */
export const sequences = mysqlTable("sequences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "archived"]).notNull().default("active"),
  totalSteps: int("totalSteps").default(0).notNull(),
  totalEnrolled: int("totalEnrolled").default(0).notNull(),
  totalCompleted: int("totalCompleted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Sequence Steps (individual emails in a sequence)
 */
export const sequenceSteps = mysqlTable("sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepNumber: int("stepNumber").notNull(), // Order in sequence (1, 2, 3...)
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  delayDays: int("delayDays").default(0).notNull(), // Days to wait before sending
  delayHours: int("delayHours").default(0).notNull(), // Additional hours
  triggerType: mysqlEnum("triggerType", ["time", "opened", "clicked", "replied", "not_opened", "not_replied"]).notNull().default("time"),
  stopOnReply: int("stopOnReply").default(1).notNull(), // Stop sequence if lead replies (1=yes, 0=no)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Sequence Enrollments (tracks leads in sequences)
 */
export const sequenceEnrollments = mysqlTable("sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  leadId: int("leadId").notNull(),
  currentStep: int("currentStep").default(0).notNull(), // 0 = not started, 1+ = step number
  status: mysqlEnum("status", ["active", "paused", "completed", "stopped", "bounced"]).notNull().default("active"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
  completedAt: timestamp("completedAt"),
  stoppedReason: varchar("stoppedReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Email Queue (scheduled email sends)
 */
export const emailQueue = mysqlTable("email_queue", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  campaignId: int("campaignId"),
  sequenceId: int("sequenceId"),
  sequenceStepId: int("sequenceStepId"),
  enrollmentId: int("enrollmentId"),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["pending", "sending", "sent", "failed", "cancelled"]).notNull().default("pending"),
  attempts: int("attempts").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
