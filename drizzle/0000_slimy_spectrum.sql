CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`extra` text NOT NULL,
	`created` text NOT NULL
);
