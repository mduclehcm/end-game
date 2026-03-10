import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const LlmUsageLogsTable = pgTable("llm_usage_logs", {
	id: varchar("id", { length: 10 }).primaryKey(),
	type: varchar("type", { length: 50 }).notNull(),
	model: varchar("model", { length: 50 }).notNull(),
	fieldKey: varchar("field_key", { length: 100 }),
	systemPrompt: text("system_prompt").notNull(),
	userInput: text("user_input").notNull(),
	output: text("output").notNull(),
	inputTokens: integer("input_tokens").notNull(),
	outputTokens: integer("output_tokens").notNull(),
	durationMs: integer("duration_ms").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LlmUsageLogRow = typeof LlmUsageLogsTable.$inferSelect;
export type LlmUsageLogInsert = typeof LlmUsageLogsTable.$inferInsert;
