CREATE TABLE `marketCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventHash` varchar(64) NOT NULL,
	`eventTitle` text NOT NULL,
	`matchedMarkets` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `marketCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketCache_eventHash_unique` UNIQUE(`eventHash`)
);
