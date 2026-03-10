import { pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { DocumentsTable } from "./resume-document.schema";

/**
 * Field values per document. Composite PK (document_id, field_id) so field_id (e.g. nanoid) is part of the key.
 * Only the document table is updated when section/entity structure changes; field value changes touch only this table.
 */
export const FieldValuesTable = pgTable(
	"resume_field_values",
	{
		documentId: varchar("document_id", { length: 10 })
			.notNull()
			.references(() => DocumentsTable.id, { onDelete: "cascade" }),
		fieldId: varchar("field_id", { length: 10 }).notNull(),
		value: text("value").notNull().default(""),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.documentId, table.fieldId] })],
);

export type FieldValueRow = typeof FieldValuesTable.$inferSelect;
