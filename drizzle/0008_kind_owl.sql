DROP TABLE `activities`;--> statement-breakpoint
DROP TABLE `campaigns`;--> statement-breakpoint
DROP TABLE `data_update_logs`;--> statement-breakpoint
DROP TABLE `email_events`;--> statement-breakpoint
DROP TABLE `email_queue`;--> statement-breakpoint
DROP TABLE `email_templates`;--> statement-breakpoint
DROP TABLE `leads`;--> statement-breakpoint
DROP TABLE `norwegian_companies`;--> statement-breakpoint
DROP TABLE `saved_filters`;--> statement-breakpoint
DROP TABLE `sequence_enrollments`;--> statement-breakpoint
DROP TABLE `sequence_steps`;--> statement-breakpoint
DROP TABLE `sequences`;--> statement-breakpoint
DROP TABLE `team_invitations`;--> statement-breakpoint
DROP TABLE `teams`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `teamId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscriptionPlan`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `monthlyLeadsQuota`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `usedLeadsThisMonth`;