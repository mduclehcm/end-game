-- System prompts: admin-managed prompts per use-case key; at most one active per key.
CREATE TABLE IF NOT EXISTS "system_prompts" (
  "id" varchar(10) PRIMARY KEY NOT NULL,
  "use_case_key" varchar(80) NOT NULL,
  "name" varchar(200) NOT NULL,
  "prompt_text" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "system_prompts_active_per_use_case"
  ON "system_prompts" ("use_case_key") WHERE "is_active" = true;
