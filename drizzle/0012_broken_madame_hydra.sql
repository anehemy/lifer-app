ALTER TABLE `users` ADD `voiceProvider` varchar(64) DEFAULT 'elevenlabs';--> statement-breakpoint
ALTER TABLE `users` ADD `googleVoice` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `elevenLabsVoice` varchar(128);