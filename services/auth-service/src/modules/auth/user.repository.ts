import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, ilike, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import type * as schema from "../../database/schema";
import {
	type OAuthAccountRow,
	OAuthAccountsTable,
	type OAuthProvider,
	type UserRow,
	UsersTable,
} from "../../database/schema";
import type { UserRole } from "../../database/schema/user.schema";

export interface CreateUserPayload {
	email: string;
	username?: string | null;
	passwordHash?: string | null;
	displayName?: string;
	avatarUrl?: string | null;
}

export interface UpsertOAuthAccountPayload {
	userId: string;
	provider: OAuthProvider;
	providerUserId: string;
	accessToken: string;
	refreshToken?: string | null;
	expiresAt?: Date | null;
}

@Injectable()
export class UserRepository {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async findById(id: string): Promise<UserRow | null> {
		const [row] = await this.db.select().from(UsersTable).where(eq(UsersTable.id, id)).limit(1);
		return row ?? null;
	}

	async findByEmail(email: string): Promise<UserRow | null> {
		const [row] = await this.db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);
		return row ?? null;
	}

	async findByUsername(username: string): Promise<UserRow | null> {
		const [row] = await this.db.select().from(UsersTable).where(eq(UsersTable.username, username)).limit(1);
		return row ?? null;
	}

	async create(payload: CreateUserPayload): Promise<UserRow> {
		const nanoid = (await import("nanoid")).nanoid;
		const id = nanoid(10);
		const [inserted] = await this.db
			.insert(UsersTable)
			.values({
				id,
				email: payload.email,
				username: payload.username ?? null,
				passwordHash: payload.passwordHash ?? null,
				displayName: payload.displayName ?? "",
				avatarUrl: payload.avatarUrl ?? null,
			})
			.returning();
		if (!inserted) throw new Error("Failed to create user");
		return inserted;
	}

	async findOAuthAccount(provider: OAuthProvider, providerUserId: string): Promise<OAuthAccountRow | null> {
		const [row] = await this.db
			.select()
			.from(OAuthAccountsTable)
			.where(and(eq(OAuthAccountsTable.provider, provider), eq(OAuthAccountsTable.providerUserId, providerUserId)))
			.limit(1);
		return row ?? null;
	}

	async upsertOAuthAccount(payload: UpsertOAuthAccountPayload): Promise<OAuthAccountRow> {
		const existing = await this.findOAuthAccount(payload.provider, payload.providerUserId);
		const values = {
			userId: payload.userId,
			provider: payload.provider,
			providerUserId: payload.providerUserId,
			accessToken: payload.accessToken,
			refreshToken: payload.refreshToken ?? null,
			expiresAt: payload.expiresAt ?? null,
		};
		if (existing) {
			const [updated] = await this.db
				.update(OAuthAccountsTable)
				.set(values)
				.where(eq(OAuthAccountsTable.id, existing.id))
				.returning();
			if (!updated) throw new Error("Failed to update oauth account");
			return updated;
		}
		const nanoid = (await import("nanoid")).nanoid;
		const id = nanoid(10);
		const [inserted] = await this.db
			.insert(OAuthAccountsTable)
			.values({ id, ...values })
			.returning();
		if (!inserted) throw new Error("Failed to create oauth account");
		return inserted;
	}

	async findAll(opts: { limit: number; offset: number; search?: string }): Promise<{ users: UserRow[]; total: number }> {
		const where = opts.search
			? or(ilike(UsersTable.email, `%${opts.search}%`), ilike(UsersTable.displayName, `%${opts.search}%`))
			: undefined;
		const [users, [countResult]] = await Promise.all([
			this.db.select().from(UsersTable).where(where).limit(opts.limit).offset(opts.offset).orderBy(UsersTable.createdAt),
			this.db.select({ count: count() }).from(UsersTable).where(where),
		]);
		return { users, total: countResult?.count ?? 0 };
	}

	async updateRole(id: string, role: UserRole): Promise<UserRow | null> {
		const [updated] = await this.db
			.update(UsersTable)
			.set({ role, updatedAt: new Date() })
			.where(eq(UsersTable.id, id))
			.returning();
		return updated ?? null;
	}

	async countByRole(role: UserRole): Promise<number> {
		const [result] = await this.db.select({ count: count() }).from(UsersTable).where(eq(UsersTable.role, role));
		return result?.count ?? 0;
	}
}
