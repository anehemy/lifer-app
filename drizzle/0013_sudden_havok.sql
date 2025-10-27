CREATE TABLE `globalSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `globalSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `globalSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `voiceProvider`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `googleVoice`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `elevenLabsVoice`;