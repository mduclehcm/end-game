-- Output structure is defined and injected by backend (e.g. parse-resume field list); not stored in DB.
ALTER TABLE "system_prompts" DROP COLUMN IF EXISTS "output_text";
