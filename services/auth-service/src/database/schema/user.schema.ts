import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const UserRole = { USER: "user", ADMIN: "admin" } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UsersTable = pgTable("users", {
	id: varchar("id", { length: 10 }).primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").unique(),
	passwordHash: text("password_hash"),
	displayName: text("display_name").notNull().default(""),
	avatarUrl: text("avatar_url"),
	role: text("role").notNull().default("user").$type<UserRole>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserRow = typeof UsersTable.$inferSelect;
export type UserInsert = typeof UsersTable.$inferInsert;
