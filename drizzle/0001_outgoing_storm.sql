CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`response` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meditationSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`meditationType` varchar(100) NOT NULL,
	`durationMinutes` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meditationSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `primaryAims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`statement` text,
	`personal` text,
	`relationships` text,
	`contribution` text,
	`health` text,
	`growth` text,
	`legacy` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `primaryAims_id` PRIMARY KEY(`id`),
	CONSTRAINT `primaryAims_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `visionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`affirmation` text,
	`connectionToPrimaryAim` text,
	`position` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `journalEntries` ADD CONSTRAINT `journalEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meditationSessions` ADD CONSTRAINT `meditationSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `primaryAims` ADD CONSTRAINT `primaryAims_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visionItems` ADD CONSTRAINT `visionItems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;