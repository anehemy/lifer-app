CREATE TABLE `combined_experiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`consolidatedWisdom` text NOT NULL,
	`primaryTheme` varchar(50),
	`archetypes` text,
	`combinedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `combined_experiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experience_combinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`combinedExperienceId` int NOT NULL,
	`journalEntryId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `experience_combinations_id` PRIMARY KEY(`id`)
);
