ALTER TABLE `meditationSessions` DROP FOREIGN KEY `meditationSessions_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `meditationSessions` MODIFY COLUMN `meditationType` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `meditationSessions` ADD `script` text;--> statement-breakpoint
ALTER TABLE `meditationSessions` ADD `audioUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `meditationSessions` ADD `reflection` text;--> statement-breakpoint
ALTER TABLE `meditationSessions` ADD `rating` int;--> statement-breakpoint
ALTER TABLE `meditationSessions` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;