-- Add full document structure (sections, entities, fields) for import/GET.
-- When set, GET returns it; when null, sections are empty and fieldValues come from fields column.
ALTER TABLE "resume_documents" ADD COLUMN IF NOT EXISTS "data" jsonb;
