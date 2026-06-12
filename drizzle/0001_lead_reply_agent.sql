DO $$ BEGIN
  CREATE TYPE "public"."inbound_status" AS ENUM('received', 'drafted', 'replied', 'ignored');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inbound_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lead_id" integer,
	"campaign_id" integer,
	"from_email" varchar(320) NOT NULL,
	"to_email" varchar(320) NOT NULL,
	"subject" text,
	"body_text" text,
	"body_html" text,
	"message_id" varchar(998),
	"in_reply_to" varchar(998),
	"classification" varchar(32),
	"confidence" integer,
	"sentiment" varchar(12),
	"status" "inbound_status" DEFAULT 'received' NOT NULL,
	"draft_reply" text,
	"draft_subject" text,
	"match_method" varchar(16),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral_stats" ALTER COLUMN "user_id" SET DATA TYPE bigint;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inbound_messages_user_id_idx" ON "inbound_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inbound_messages_lead_id_idx" ON "inbound_messages" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inbound_messages_status_idx" ON "inbound_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inbound_messages_created_at_idx" ON "inbound_messages" USING btree ("created_at");
