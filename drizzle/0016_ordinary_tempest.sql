CREATE TABLE `dataNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryId` int NOT NULL,
	`fieldName` varchar(64) NOT NULL,
	`promptQuestion` text NOT NULL,
	`isDismissed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dataNotifications` ADD CONSTRAINT `dataNotifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dataNotifications` ADD CONSTRAINT `dataNotifications_entryId_journalEntries_id_fk` FOREIGN KEY (`entryId`) REFERENCES `journalEntries`(`id`) ON DELETE cascade ON UPDATE no action;