import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const UsersTable = pgTable("users", {
	id: varchar("id", { length: 10 }).primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").unique(),
	passwordHash: text("password_hash"),
	displayName: text("display_name").notNull().default(""),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserRow = typeof UsersTable.$inferSelect;
export type UserInsert = typeof UsersTable.$inferInsert;
