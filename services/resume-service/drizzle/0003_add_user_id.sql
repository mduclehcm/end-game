-- Add user_id to resume_documents for multi-tenant scoping (bound to auth user id from JWT sub).
ALTER TABLE "resume_documents" ADD COLUMN IF NOT EXISTS "user_id" varchar(10) NOT NULL DEFAULT 'legacy';
ALTER TABLE "resume_documents" ALTER COLUMN "user_id" DROP DEFAULT;
