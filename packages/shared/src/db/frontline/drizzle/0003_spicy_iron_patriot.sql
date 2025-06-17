PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text NOT NULL,
	`generalType` integer NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attachment`("id", "messageId", "generalType", "url") SELECT "id", "messageId", "generalType", "url" FROM `attachment`;--> statement-breakpoint
DROP TABLE `attachment`;--> statement-breakpoint
ALTER TABLE `__new_attachment` RENAME TO `attachment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_message` (
	`id` text PRIMARY KEY NOT NULL,
	`threadId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`body` text(50000) NOT NULL,
	`model` text NOT NULL,
	`reasoningLevel` integer NOT NULL,
	`search` integer NOT NULL,
	FOREIGN KEY (`threadId`) REFERENCES `thread`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_message`("id", "threadId", "createdAt", "body", "model", "reasoningLevel", "search") SELECT "id", "threadId", "createdAt", "body", "model", "reasoningLevel", "search" FROM `message`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
ALTER TABLE `__new_message` RENAME TO `message`;--> statement-breakpoint
CREATE INDEX `message_body+createdAt_idx` ON `message` (`body`,`createdAt`);--> statement-breakpoint
CREATE INDEX `message_body+createdAt+threadId_idx` ON `message` (`body`,`createdAt`,`threadId`);--> statement-breakpoint
CREATE INDEX `message_createdAt+threadId_idx` ON `message` (`createdAt`,`threadId`);--> statement-breakpoint
CREATE INDEX `message_createdAt_idx` ON `message` (`createdAt`);--> statement-breakpoint
CREATE TABLE `__new_thread` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`lastKnownModification` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_thread`("id", "title", "lastKnownModification") SELECT "id", "title", "lastKnownModification" FROM `thread`;--> statement-breakpoint
DROP TABLE `thread`;--> statement-breakpoint
ALTER TABLE `__new_thread` RENAME TO `thread`;--> statement-breakpoint
CREATE INDEX `thread_lastKnownModification_idx` ON `thread` (`lastKnownModification`);--> statement-breakpoint
CREATE INDEX `thread_title+lastKnownModification_idx` ON `thread` (`title`,`lastKnownModification`);