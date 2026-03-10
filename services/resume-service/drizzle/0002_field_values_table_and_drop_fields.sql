-- Create resume_field_values table: composite PK (document_id, field_id).
-- Field values are updated only in this table; document table is updated only for title/section/entity changes.
CREATE TABLE IF NOT EXISTS "resume_field_values" (
  "document_id" varchar(10) NOT NULL REFERENCES "resume_documents"("id") ON DELETE CASCADE,
  "field_id" varchar(10) NOT NULL,
  "value" text NOT NULL DEFAULT '',
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("document_id", "field_id")
);

-- Migrate existing field values from resume_documents.fields (jsonb) into resume_field_values, if column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resume_documents' AND column_name = 'fields'
  ) THEN
    INSERT INTO "resume_field_values" ("document_id", "field_id", "value", "updated_at")
    SELECT d.id, kv.key, COALESCE(kv.value, ''), d.updated_at
    FROM "resume_documents" d,
    LATERAL jsonb_each_text(COALESCE(d.fields, '{}'::jsonb)) AS kv(key, value)
    ON CONFLICT ("document_id", "field_id") DO NOTHING;
  END IF;
END $$;

-- Drop legacy fields column from resume_documents.
ALTER TABLE "resume_documents" DROP COLUMN IF EXISTS "fields";
