ALTER TABLE `leads` DROP INDEX `leads_trackingId_unique`;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `trackingId` varchar(64);