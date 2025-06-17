ALTER TABLE `thread` RENAME COLUMN "lastKnownModification" TO "lastModified";--> statement-breakpoint
DROP INDEX `thread_lastKnownModification_idx`;--> statement-breakpoint
DROP INDEX `thread_title+lastKnownModification_idx`;--> statement-breakpoint
CREATE INDEX `thread_lastKnownModification_idx` ON `thread` (`lastModified`);--> statement-breakpoint
CREATE INDEX `thread_title+lastKnownModification_idx` ON `thread` (`title`,`lastModified`);