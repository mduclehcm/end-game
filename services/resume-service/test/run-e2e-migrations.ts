/**
 * Runs migrations 0004–0007 so e2e DB has system_prompts (role + guide only) and llm_usage_logs prompt columns.
 * Safe to run multiple times (SQL uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS where applicable).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const drizzleDir = join(__dirname, "../drizzle");

export async function runE2eMigrations(): Promise<void> {
	const connectionString = process.env.DATABASE_URL ?? "postgresql://algo:algo@localhost:5433/algo_resume";
	const pool = new Pool({ connectionString });
	try {
		await pool.query(readFileSync(join(drizzleDir, "0004_system_prompts.sql"), "utf8"));
		await pool.query(readFileSync(join(drizzleDir, "0005_llm_usage_prompt_id.sql"), "utf8"));
		await pool.query(readFileSync(join(drizzleDir, "0006_system_prompt_parts.sql"), "utf8"));
		await pool.query(readFileSync(join(drizzleDir, "0007_drop_system_prompt_output.sql"), "utf8"));
		await pool.query(readFileSync(join(drizzleDir, "0008_resume_exports.sql"), "utf8"));
	} finally {
		await pool.end();
	}
}
