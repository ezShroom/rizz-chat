CREATE TABLE `thread` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`lastModification` integer
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`threadId` text,
	`createdAt` integer,
	`body` text(50000),
	`model` text,
	`reasoningLevel` integer,
	`search` integer,
	FOREIGN KEY (`threadId`) REFERENCES `thread`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text,
	`generalType` integer,
	`url` text,
	FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE no action
);