import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const ExportStatus = {
	pending: "pending",
	processing: "processing",
	ready: "ready",
	failed: "failed",
} as const;
export type ExportStatusType = (typeof ExportStatus)[keyof typeof ExportStatus];

export const ExportFormat = {
	pdf: "pdf",
} as const;
export type ExportFormatType = (typeof ExportFormat)[keyof typeof ExportFormat];

export const ResumeExportsTable = pgTable("resume_exports", {
	id: varchar("id", { length: 10 }).primaryKey(),
	userId: varchar("user_id", { length: 10 }).notNull(),
	documentId: varchar("document_id", { length: 10 }).notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending"),
	format: varchar("format", { length: 10 }).notNull().default("pdf"),
	storageBucket: varchar("storage_bucket", { length: 255 }),
	storageKey: text("storage_key"),
	fileName: varchar("file_name", { length: 255 }),
	mimeType: varchar("mime_type", { length: 100 }),
	sizeBytes: integer("size_bytes"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	completedAt: timestamp("completed_at"),
});

export type ResumeExportRow = typeof ResumeExportsTable.$inferSelect;
export type ResumeExportInsert = typeof ResumeExportsTable.$inferInsert;
