CREATE TABLE `experienceAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryId` int NOT NULL,
	`userId` int NOT NULL,
	`valence` enum('positive','negative','neutral'),
	`impact` int,
	`predictability` int,
	`challenge` int,
	`emotionalSignificance` int,
	`worldviewChange` int,
	`primaryTheme` enum('Love','Value','Power','Freedom','Truth','Justice'),
	`secondaryThemes` text,
	`experienceArchetype` varchar(255),
	`keywords` text,
	`emotionalTone` varchar(100),
	`clusterId` int,
	`semanticEmbedding` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experienceAnalyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `experienceAnalyses_entryId_unique` UNIQUE(`entryId`)
);
--> statement-breakpoint
ALTER TABLE `experienceAnalyses` ADD CONSTRAINT `experienceAnalyses_entryId_journalEntries_id_fk` FOREIGN KEY (`entryId`) REFERENCES `journalEntries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `experienceAnalyses` ADD CONSTRAINT `experienceAnalyses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;