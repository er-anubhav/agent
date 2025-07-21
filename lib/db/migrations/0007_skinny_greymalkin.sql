ALTER TABLE "Document" ADD COLUMN "source" varchar DEFAULT 'upload';--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "sourceMetadata" json;