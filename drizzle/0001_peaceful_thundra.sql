CREATE TABLE `marketMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`marketId` int NOT NULL,
	`relevanceScore` int NOT NULL,
	`reasoning` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketMatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`venueId` int NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` varchar(64),
	`status` enum('open','active','closed','resolved') NOT NULL DEFAULT 'open',
	`closeTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `markets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`keywords` text,
	`source` varchar(64) NOT NULL,
	`velocity` int NOT NULL,
	`category` varchar(64) NOT NULL,
	`url` text,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`marketId` int NOT NULL,
	`totalScore` int NOT NULL,
	`relevanceScore` int NOT NULL,
	`velocityScore` int NOT NULL,
	`liquidityScore` int NOT NULL,
	`urgencyScore` int NOT NULL,
	`momentumScore` int NOT NULL,
	`momentum1h` int,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`priceYes` int,
	`priceNo` int,
	`liquidity` int,
	`volume` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`apiBase` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venues_id` PRIMARY KEY(`id`),
	CONSTRAINT `venues_name_unique` UNIQUE(`name`)
);
