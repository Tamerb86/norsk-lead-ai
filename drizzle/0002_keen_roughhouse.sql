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
ALTER TABLE `leads` ADD `trackingId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `unsubscribed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_trackingId_unique` UNIQUE(`trackingId`);