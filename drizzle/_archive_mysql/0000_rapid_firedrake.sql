CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
