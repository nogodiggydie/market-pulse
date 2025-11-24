ALTER TABLE `users` ADD `stripe_customer_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_tier` enum('free','pro','premium') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_status` enum('active','canceled','past_due','trialing','incomplete');--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_ends_at` timestamp;