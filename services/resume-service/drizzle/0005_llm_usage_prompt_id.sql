-- Link LLM usage logs to system prompt (for "view all requests for this prompt").
ALTER TABLE "llm_usage_logs" ADD COLUMN IF NOT EXISTS "prompt_id" varchar(10);
ALTER TABLE "llm_usage_logs" ADD COLUMN IF NOT EXISTS "prompt_use_case_key" varchar(80);
