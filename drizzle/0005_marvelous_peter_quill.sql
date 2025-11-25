CREATE TABLE `position_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`positionId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `position_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`color` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `positions` ADD `entryReasoning` text;--> statement-breakpoint
ALTER TABLE `positions` ADD `exitReasoning` text;--> statement-breakpoint
ALTER TABLE `positions` ADD `lessonsLearned` text;