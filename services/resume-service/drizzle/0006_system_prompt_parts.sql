-- System prompt: final prompt = concatenation of parts (role, guide, output).
ALTER TABLE "system_prompts"
  ADD COLUMN IF NOT EXISTS "role_text" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "guide_text" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "output_text" text NOT NULL DEFAULT '';

-- Backfill: put existing prompt_text into role part (only if prompt_text still exists).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_prompts' AND column_name = 'prompt_text') THEN
    UPDATE "system_prompts" SET "role_text" = "prompt_text" WHERE "role_text" = '' AND "prompt_text" IS NOT NULL;
    ALTER TABLE "system_prompts" DROP COLUMN "prompt_text";
  END IF;
END $$;
