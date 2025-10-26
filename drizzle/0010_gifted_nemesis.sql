CREATE TABLE `mrMgConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`actionType` varchar(64),
	`actionTarget` varchar(255),
	`actionStatus` enum('pending','confirmed','executed','cancelled'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mrMgConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mrMgConversations` ADD CONSTRAINT `mrMgConversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;