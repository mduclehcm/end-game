import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const DocumentsTable = pgTable("resume_documents", {
	id: varchar("id", { length: 10 }).primaryKey(),
	title: varchar("title", { length: 50 }).notNull(),
	fields: jsonb("fields").$type<Record<string, string>>().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DocumentRow = typeof DocumentsTable.$inferSelect;
