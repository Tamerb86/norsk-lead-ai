DO $$ BEGIN
  CREATE TYPE "public"."calendar_event_type" AS ENUM('follow_up', 'meeting', 'call', 'task', 'reminder');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."data_update_status" AS ENUM('started', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."data_update_type" AS ENUM('manual', 'automatic');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."email_event_type" AS ENUM('open', 'click', 'bounce', 'unsubscribe', 'reply');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."email_queue_status" AS ENUM('pending', 'sending', 'sent', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."enrichment_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'paused', 'completed', 'stopped', 'bounced');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."lead_status" AS ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'interested', 'not_interested', 'bounced', 'unsubscribed');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."role" AS ENUM('admin', 'manager', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."sequence_status" AS ENUM('active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."trigger_type" AS ENUM('time', 'opened', 'clicked', 'replied', 'not_opened', 'not_replied');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_test_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"variant_id" varchar(1) NOT NULL,
	"subject" text,
	"body" text,
	"sender_name" varchar(255),
	"sender_email" varchar(255),
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"opened_count" integer DEFAULT 0 NOT NULL,
	"clicked_count" integer DEFAULT 0 NOT NULL,
	"replied_count" integer DEFAULT 0 NOT NULL,
	"bounced_count" integer DEFAULT 0 NOT NULL,
	"open_rate" real DEFAULT 0,
	"click_rate" real DEFAULT 0,
	"reply_rate" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"test_type" varchar(20) DEFAULT 'subject' NOT NULL,
	"sample_size" integer DEFAULT 20 NOT NULL,
	"winning_criteria" varchar(20) DEFAULT 'open_rate' NOT NULL,
	"auto_select_winner" boolean DEFAULT true NOT NULL,
	"test_duration_hours" integer DEFAULT 24 NOT NULL,
	"winner_id" varchar(1),
	"winner_selected_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"teamId" integer,
	"leadId" integer,
	"campaignId" integer,
	"type" varchar(50) NOT NULL,
	"description" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"entity_name" varchar(255),
	"details" text,
	"old_values" text,
	"new_values" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"api_key" varchar(500),
	"api_endpoint" varchar(500),
	"model" varchar(100),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"settings" json,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_type" varchar(50) DEFAULT 'follow_up' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" varchar(255),
	"company_id" integer,
	"lead_id" integer,
	"campaign_id" integer,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"reminder_minutes" integer DEFAULT 30,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" varchar(255),
	"parent_event_id" integer,
	"color" varchar(20) DEFAULT '#6366f1',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"emailSubject" text,
	"emailBody" text,
	"emailTemplateId" integer,
	"senderName" varchar(255),
	"senderEmail" varchar(255),
	"replyTo" varchar(255),
	"totalRecipients" integer DEFAULT 0 NOT NULL,
	"totalSent" integer DEFAULT 0 NOT NULL,
	"totalDelivered" integer DEFAULT 0 NOT NULL,
	"totalOpened" integer DEFAULT 0 NOT NULL,
	"totalClicked" integer DEFAULT 0 NOT NULL,
	"totalReplied" integer DEFAULT 0 NOT NULL,
	"totalBounced" integer DEFAULT 0 NOT NULL,
	"totalUnsubscribed" integer DEFAULT 0 NOT NULL,
	"scheduledAt" timestamp,
	"sentAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_update_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"companiesAdded" integer DEFAULT 0 NOT NULL,
	"companiesUpdated" integer DEFAULT 0 NOT NULL,
	"companiesDeleted" integer DEFAULT 0 NOT NULL,
	"errorMessage" text,
	"startedAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"trackingId" varchar(64) NOT NULL,
	"eventType" varchar(20) NOT NULL,
	"linkUrl" text,
	"userAgent" text,
	"ipAddress" varchar(45),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"campaign_id" integer,
	"sequence_id" integer,
	"sequence_step_id" integer,
	"enrollment_id" integer,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"sentAt" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lastAttemptAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"category" varchar(50),
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrichment_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"filters" text,
	"total_companies" integer DEFAULT 0 NOT NULL,
	"processed_companies" integer DEFAULT 0 NOT NULL,
	"successful_companies" integer DEFAULT 0 NOT NULL,
	"failed_companies" integer DEFAULT 0 NOT NULL,
	"status" "enrichment_status" DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrichment_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer,
	"status" "enrichment_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"enriched_fields" text,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"engagement_score" integer DEFAULT 0 NOT NULL,
	"company_score" integer DEFAULT 0 NOT NULL,
	"behavior_score" integer DEFAULT 0 NOT NULL,
	"tier" varchar(20) DEFAULT 'cold' NOT NULL,
	"last_engagement_at" timestamp,
	"last_score_update" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lead_scores_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"trackingId" varchar(64),
	"unsubscribed" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"emailSentAt" timestamp,
	"emailDeliveredAt" timestamp,
	"emailOpenedAt" timestamp,
	"emailClickedAt" timestamp,
	"emailRepliedAt" timestamp,
	"emailBouncedAt" timestamp,
	"emailUnsubscribedAt" timestamp,
	"openCount" integer DEFAULT 0 NOT NULL,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"followUpCount" integer DEFAULT 0 NOT NULL,
	"lastFollowUpAt" timestamp,
	"nextFollowUpAt" timestamp,
	"notes" text,
	"replyContent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "norwegian_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisasjonsnummer" varchar(9) NOT NULL,
	"navn" varchar(500) NOT NULL,
	"organisasjonsform" varchar(50),
	"naeringskode1" varchar(10),
	"naeringsbeskrivelse1" text,
	"naeringskode2" varchar(10),
	"naeringsbeskrivelse2" text,
	"antallAnsatte" integer,
	"forretningsadresse" text,
	"poststed" varchar(100),
	"postnummer" varchar(4),
	"kommune" varchar(100),
	"fylke" varchar(100),
	"epostadresse" varchar(255),
	"telefon" varchar(20),
	"hjemmeside" varchar(500),
	"stiftelsesdato" date,
	"registreringsdato" date,
	"konkurs" boolean DEFAULT false NOT NULL,
	"underAvvikling" boolean DEFAULT false NOT NULL,
	"underTvangsavviklingEllerTvangsopplosning" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "norwegian_companies_organisasjonsnummer_unique" UNIQUE("organisasjonsnummer")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"relatedId" integer,
	"relatedType" varchar(50),
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"referral_code" varchar(20) NOT NULL,
	"total_invites" integer DEFAULT 0,
	"total_signups" integer DEFAULT 0,
	"total_conversions" integer DEFAULT 0,
	"total_rewards_earned" integer DEFAULT 0,
	"pending_rewards" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_stats_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "referral_stats_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_id" integer,
	"referral_code" varchar(20) NOT NULL,
	"referred_email" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reward_type" varchar(50),
	"reward_amount" integer,
	"reward_claimed" boolean DEFAULT false,
	"signed_up_at" timestamp,
	"converted_at" timestamp,
	"rewarded_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tokenHash" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"userAgent" text,
	"ipAddress" varchar(45),
	CONSTRAINT "refresh_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"listName" varchar(100) DEFAULT 'default',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"filters" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "score_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_score_id" integer NOT NULL,
	"previous_score" integer NOT NULL,
	"new_score" integer NOT NULL,
	"change_reason" varchar(255) NOT NULL,
	"rule_id" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"condition" varchar(50) NOT NULL,
	"operator" varchar(20) NOT NULL,
	"value" text NOT NULL,
	"score_change" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sequence_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"sequence_id" integer NOT NULL,
	"lead_id" integer NOT NULL,
	"currentStep" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"enrolledAt" timestamp DEFAULT now() NOT NULL,
	"lastEmailSentAt" timestamp,
	"completedAt" timestamp,
	"stoppedReason" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sequence_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"sequence_id" integer NOT NULL,
	"stepNumber" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"delayDays" integer DEFAULT 0 NOT NULL,
	"delayHours" integer DEFAULT 0 NOT NULL,
	"triggerType" varchar(20) DEFAULT 'time' NOT NULL,
	"stopOnReply" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"teamId" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"totalSteps" integer DEFAULT 0 NOT NULL,
	"totalEnrolled" integer DEFAULT 0 NOT NULL,
	"totalCompleted" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"category" varchar(50),
	"is_secret" boolean DEFAULT false NOT NULL,
	"updated_by" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" varchar(20) NOT NULL,
	"invitedBy" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"token" varchar(64) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"ownerId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_onboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"completedSteps" json DEFAULT '[]'::json NOT NULL,
	"currentStep" integer DEFAULT 1 NOT NULL,
	"tourCompleted" boolean DEFAULT false NOT NULL,
	"tourSkipped" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_onboarding_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"teamId" integer,
	"subscriptionPlan" varchar(50),
	"monthlyLeadsQuota" integer,
	"usedLeadsThisMonth" integer,
	"password_hash" varchar(255),
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"subscription_status" varchar(50),
	"subscription_period_end" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" varchar(255),
	"two_factor_backup_codes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_id" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"payload" text NOT NULL,
	"response_status" integer,
	"response_body" text,
	"response_time" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp,
	"error_message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"events" text NOT NULL,
	"custom_headers" text,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"successful_deliveries" integer DEFAULT 0 NOT NULL,
	"failed_deliveries" integer DEFAULT 0 NOT NULL,
	"last_delivery_at" timestamp,
	"last_delivery_status" varchar(20),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $constraint$ BEGIN
  ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $constraint$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_test_variants_test_id_idx" ON "ab_test_variants" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_tests_campaign_id_idx" ON "ab_tests" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_tests_user_id_idx" ON "ab_tests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ab_tests_status_idx" ON "ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_user_id_idx" ON "campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_created_at_idx" ON "campaigns" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_jobs_user_id_idx" ON "enrichment_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_jobs_status_idx" ON "enrichment_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_jobs_created_at_idx" ON "enrichment_jobs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_queue_company_id_idx" ON "enrichment_queue" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_queue_status_idx" ON "enrichment_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_queue_priority_idx" ON "enrichment_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_queue_created_at_idx" ON "enrichment_queue" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_scores_lead_id_idx" ON "lead_scores" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_scores_user_id_idx" ON "lead_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_scores_total_score_idx" ON "lead_scores" USING btree ("total_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_scores_tier_idx" ON "lead_scores" USING btree ("tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_user_id_idx" ON "leads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_campaign_id_idx" ON "leads" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_company_id_idx" ON "leads" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_tracking_id_idx" ON "leads" USING btree ("trackingId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fylke_idx" ON "norwegian_companies" USING btree ("fylke");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kommune_idx" ON "norwegian_companies" USING btree ("kommune");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "naeringskode1_idx" ON "norwegian_companies" USING btree ("naeringskode1");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orgnr_idx" ON "norwegian_companies" USING btree ("organisasjonsnummer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "navn_idx" ON "norwegian_companies" USING btree ("navn");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_history_lead_score_id_idx" ON "score_history" USING btree ("lead_score_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scoring_rules_user_id_idx" ON "scoring_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scoring_rules_is_active_idx" ON "scoring_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_status_idx" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_created_at_idx" ON "webhook_deliveries" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_user_id_idx" ON "webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_is_active_idx" ON "webhooks" USING btree ("is_active");


