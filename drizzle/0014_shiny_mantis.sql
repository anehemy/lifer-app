CREATE TABLE `userEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`eventData` text,
	`sessionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userEvents` ADD CONSTRAINT `userEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;