CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int,
	`leadId` int,
	`campaignId` int,
	`type` varchar(50) NOT NULL,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('draft','scheduled','sending','sent','paused','completed') NOT NULL DEFAULT 'draft',
	`emailSubject` text,
	`emailBody` text,
	`emailTemplateId` int,
	`senderName` varchar(255),
	`senderEmail` varchar(255),
	`replyTo` varchar(255),
	`totalRecipients` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`totalDelivered` int NOT NULL DEFAULT 0,
	`totalOpened` int NOT NULL DEFAULT 0,
	`totalClicked` int NOT NULL DEFAULT 0,
	`totalReplied` int NOT NULL DEFAULT 0,
	`totalBounced` int NOT NULL DEFAULT 0,
	`totalUnsubscribed` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_update_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('manual','automatic') NOT NULL,
	`status` enum('started','completed','failed') NOT NULL,
	`companiesAdded` int NOT NULL DEFAULT 0,
	`companiesUpdated` int NOT NULL DEFAULT 0,
	`companiesDeleted` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_update_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int NOT NULL,
	`trackingId` varchar(64) NOT NULL,
	`eventType` enum('open','click','bounce','unsubscribe','reply') NOT NULL,
	`linkUrl` text,
	`userAgent` text,
	`ipAddress` varchar(45),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int,
	`sequenceId` int,
	`sequenceStepId` int,
	`enrollmentId` int,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`category` varchar(50),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`campaignId` int NOT NULL,
	`companyId` int NOT NULL,
	`trackingId` varchar(64),
	`unsubscribed` boolean NOT NULL DEFAULT false,
	`status` enum('pending','sent','delivered','opened','clicked','replied','interested','not_interested','bounced','unsubscribed') NOT NULL DEFAULT 'pending',
	`emailSentAt` timestamp,
	`emailDeliveredAt` timestamp,
	`emailOpenedAt` timestamp,
	`emailClickedAt` timestamp,
	`emailRepliedAt` timestamp,
	`emailBouncedAt` timestamp,
	`emailUnsubscribedAt` timestamp,
	`openCount` int NOT NULL DEFAULT 0,
	`clickCount` int NOT NULL DEFAULT 0,
	`followUpCount` int NOT NULL DEFAULT 0,
	`lastFollowUpAt` timestamp,
	`nextFollowUpAt` timestamp,
	`notes` text,
	`replyContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `norwegian_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisasjonsnummer` varchar(9) NOT NULL,
	`navn` varchar(500) NOT NULL,
	`organisasjonsform` varchar(50),
	`naeringskode1` varchar(10),
	`naeringsbeskrivelse1` text,
	`naeringskode2` varchar(10),
	`naeringsbeskrivelse2` text,
	`antallAnsatte` int,
	`forretningsadresse` text,
	`poststed` varchar(100),
	`postnummer` varchar(4),
	`kommune` varchar(100),
	`fylke` varchar(100),
	`epostadresse` varchar(255),
	`telefon` varchar(20),
	`hjemmeside` varchar(500),
	`stiftelsesdato` date,
	`registreringsdato` date,
	`konkurs` boolean NOT NULL DEFAULT false,
	`underAvvikling` boolean NOT NULL DEFAULT false,
	`underTvangsavviklingEllerTvangsopplosning` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `norwegian_companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `norwegian_companies_organisasjonsnummer_unique` UNIQUE(`organisasjonsnummer`)
);
--> statement-breakpoint
CREATE TABLE `saved_filters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`filters` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_filters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequence_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`leadId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`status` enum('active','paused','completed','stopped','bounced') NOT NULL DEFAULT 'active',
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`lastEmailSentAt` timestamp,
	`completedAt` timestamp,
	`stoppedReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sequence_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequence_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`delayHours` int NOT NULL DEFAULT 0,
	`triggerType` enum('time','opened','clicked','replied','not_opened','not_replied') NOT NULL DEFAULT 'time',
	`stopOnReply` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sequence_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`totalSteps` int NOT NULL DEFAULT 0,
	`totalEnrolled` int NOT NULL DEFAULT 0,
	`totalCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('admin','manager','viewer') NOT NULL,
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','viewer') NOT NULL DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE `users` ADD `teamId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyLeadsQuota` int;--> statement-breakpoint
ALTER TABLE `users` ADD `usedLeadsThisMonth` int;--> statement-breakpoint
CREATE INDEX `fylke_idx` ON `norwegian_companies` (`fylke`);--> statement-breakpoint
CREATE INDEX `kommune_idx` ON `norwegian_companies` (`kommune`);--> statement-breakpoint
CREATE INDEX `naeringskode1_idx` ON `norwegian_companies` (`naeringskode1`);--> statement-breakpoint
CREATE INDEX `orgnr_idx` ON `norwegian_companies` (`organisasjonsnummer`);--> statement-breakpoint
CREATE INDEX `navn_idx` ON `norwegian_companies` (`navn`);