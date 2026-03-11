import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { UsersTable } from "./user.schema";

export const OAuthProviders = ["google", "zalo"] as const;
export type OAuthProvider = (typeof OAuthProviders)[number];

export const OAuthAccountsTable = pgTable("oauth_accounts", {
	id: varchar("id", { length: 10 }).primaryKey(),
	userId: varchar("user_id", { length: 10 })
		.notNull()
		.references(() => UsersTable.id, { onDelete: "cascade" }),
	provider: varchar("provider", { length: 20 }).notNull(),
	providerUserId: text("provider_user_id").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OAuthAccountRow = typeof OAuthAccountsTable.$inferSelect;
export type OAuthAccountInsert = typeof OAuthAccountsTable.$inferInsert;
