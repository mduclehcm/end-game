import type { DocumentData } from "@algo/cv-core";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** Document structure only (sections + entities + field definitions). Field values live in resume_field_values. */
export type DocumentStructure = Omit<DocumentData, "fieldValues">;

export const DocumentsTable = pgTable("resume_documents", {
	id: varchar("id", { length: 10 }).primaryKey(),
	title: varchar("title", { length: 50 }).notNull(),
	/** Section/entity/field structure only. Field values are in resume_field_values. */
	data: jsonb("data").$type<DocumentStructure | null>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DocumentRow = typeof DocumentsTable.$inferSelect;
