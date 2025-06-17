PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text,
	`generalType` integer,
	`url` text,
	FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attachment`("id", "messageId", "generalType", "url") SELECT "id", "messageId", "generalType", "url" FROM `attachment`;--> statement-breakpoint
DROP TABLE `attachment`;--> statement-breakpoint
ALTER TABLE `__new_attachment` RENAME TO `attachment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_message` (
	`id` text PRIMARY KEY NOT NULL,
	`threadId` text,
	`createdAt` integer,
	`body` text(50000),
	`model` text,
	`reasoningLevel` integer,
	`search` integer,
	FOREIGN KEY (`threadId`) REFERENCES `thread`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_message`("id", "threadId", "createdAt", "body", "model", "reasoningLevel", "search") SELECT "id", "threadId", "createdAt", "body", "model", "reasoningLevel", "search" FROM `message`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
ALTER TABLE `__new_message` RENAME TO `message`;--> statement-breakpoint
CREATE INDEX `message_body+createdAt_idx` ON `message` (`body`,`createdAt`);--> statement-breakpoint
CREATE INDEX `message_body+createdAt+threadId_idx` ON `message` (`body`,`createdAt`,`threadId`);--> statement-breakpoint
CREATE INDEX `message_createdAt+threadId_idx` ON `message` (`createdAt`,`threadId`);--> statement-breakpoint
CREATE INDEX `message_createdAt_idx` ON `message` (`createdAt`);