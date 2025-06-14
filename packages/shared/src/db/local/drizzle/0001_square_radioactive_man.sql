ALTER TABLE `thread` RENAME COLUMN "lastModification" TO "lastKnownModification";--> statement-breakpoint
CREATE INDEX `thread_lastKnownModification_idx` ON `thread` (`lastKnownModification`);--> statement-breakpoint
CREATE INDEX `thread_title+lastKnownModification_idx` ON `thread` (`title`,`lastKnownModification`);--> statement-breakpoint
CREATE INDEX `message_body+createdAt_idx` ON `message` (`body`,`createdAt`);--> statement-breakpoint
CREATE INDEX `message_body+createdAt+threadId_idx` ON `message` (`body`,`createdAt`,`threadId`);--> statement-breakpoint
CREATE INDEX `message_createdAt+threadId_idx` ON `message` (`createdAt`,`threadId`);--> statement-breakpoint
CREATE INDEX `message_createdAt_idx` ON `message` (`createdAt`);