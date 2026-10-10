CREATE TABLE `note_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_url` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
