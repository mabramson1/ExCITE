ALTER TABLE "project" ADD COLUMN "share_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_share_id_unique" UNIQUE("share_id");