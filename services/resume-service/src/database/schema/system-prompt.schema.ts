import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** Part keys used to build the final prompt: final = [role, guide].filter(Boolean).join("\n\n"). Output structure is injected by backend per use case. */
export const PROMPT_PART_KEYS = ["role", "guide"] as const;
export type PromptPartKey = (typeof PROMPT_PART_KEYS)[number];

export const SystemPromptsTable = pgTable("system_prompts", {
	id: varchar("id", { length: 10 }).primaryKey(),
	useCaseKey: varchar("use_case_key", { length: 80 }).notNull(),
	name: varchar("name", { length: 200 }).notNull(),
	roleText: text("role_text").notNull().default(""),
	guideText: text("guide_text").notNull().default(""),
	isActive: boolean("is_active").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SystemPromptRow = typeof SystemPromptsTable.$inferSelect;
export type SystemPromptInsert = typeof SystemPromptsTable.$inferInsert;

/** Build final prompt from parts (role, guide). */
export function buildPromptText(parts: { roleText: string; guideText: string }): string {
	const arr = [parts.roleText.trim(), parts.guideText.trim()].filter(Boolean);
	return arr.join("\n\n");
}
