ALTER TABLE `users` ADD `subscriptionPlan` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyLeadsQuota` int;--> statement-breakpoint
ALTER TABLE `users` ADD `usedLeadsThisMonth` int;