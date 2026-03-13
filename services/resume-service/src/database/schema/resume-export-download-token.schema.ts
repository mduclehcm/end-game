import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const ResumeExportDownloadTokensTable = pgTable(
	"resume_export_download_tokens",
	{
		id: varchar("id", { length: 10 }).primaryKey(),
		exportId: varchar("export_id", { length: 10 }).notNull(),
		userId: varchar("user_id", { length: 10 }).notNull(),
		tokenHash: varchar("token_hash", { length: 64 }).notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		usedAt: timestamp("used_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
);

export type ResumeExportDownloadTokenRow =
	typeof ResumeExportDownloadTokensTable.$inferSelect;
export type ResumeExportDownloadTokenInsert =
	typeof ResumeExportDownloadTokensTable.$inferInsert;
