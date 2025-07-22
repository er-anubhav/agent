-- Manual migration to fix the document table column
-- Run this in your database console (like Vercel Postgres dashboard)

-- Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Document' AND table_schema = 'public';

-- If there's a 'text' column, rename it to 'kind'
-- ALTER TABLE "Document" RENAME COLUMN "text" TO "kind";

-- If there's no 'kind' column at all, add it
-- ALTER TABLE "Document" ADD COLUMN "kind" varchar NOT NULL DEFAULT 'text';
