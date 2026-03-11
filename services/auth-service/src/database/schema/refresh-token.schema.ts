import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { UsersTable } from "./user.schema";

export const RefreshTokensTable = pgTable("refresh_tokens", {
	id: varchar("id", { length: 10 }).primaryKey(),
	userId: varchar("user_id", { length: 10 })
		.notNull()
		.references(() => UsersTable.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	revokedAt: timestamp("revoked_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RefreshTokenRow = typeof RefreshTokensTable.$inferSelect;
export type RefreshTokenInsert = typeof RefreshTokensTable.$inferInsert;
