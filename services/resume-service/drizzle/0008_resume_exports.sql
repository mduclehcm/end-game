-- Resume exports: async PDF export jobs and one-time download tokens.
CREATE TABLE IF NOT EXISTS "resume_exports" (
  "id" varchar(10) PRIMARY KEY NOT NULL,
  "user_id" varchar(10) NOT NULL,
  "document_id" varchar(10) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "format" varchar(10) NOT NULL DEFAULT 'pdf',
  "storage_bucket" varchar(255),
  "storage_key" text,
  "file_name" varchar(255),
  "mime_type" varchar(100),
  "size_bytes" integer,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "resume_exports_user_created"
  ON "resume_exports" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "resume_exports_status"
  ON "resume_exports" ("status") WHERE "status" = 'pending';

CREATE TABLE IF NOT EXISTS "resume_export_download_tokens" (
  "id" varchar(10) PRIMARY KEY NOT NULL,
  "export_id" varchar(10) NOT NULL,
  "user_id" varchar(10) NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "resume_export_download_tokens_export"
  ON "resume_export_download_tokens" ("export_id");

CREATE INDEX IF NOT EXISTS "resume_export_download_tokens_expires"
  ON "resume_export_download_tokens" ("expires_at");
