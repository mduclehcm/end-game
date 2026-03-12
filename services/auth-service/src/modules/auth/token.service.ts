import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import type * as schema from "../../database/schema";
import { RefreshTokensTable } from "../../database/schema";

export interface AccessTokenPayload {
	sub: string;
	email: string;
}

@Injectable()
export class TokenService {
	constructor(
		@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
		private readonly jwtService: JwtService,
		private readonly config: ConfigService,
	) {}

	signAccessToken(payload: AccessTokenPayload): string {
		return this.jwtService.sign(
			{ ...payload, iss: "algovn" },
			{
				secret: this.config.getOrThrow<string>("JWT_SECRET"),
				expiresIn: 900,
			},
		);
	}

	verifyAccessToken(token: string): AccessTokenPayload | null {
		try {
			const payload = this.jwtService.verify<AccessTokenPayload>(token, {
				secret: this.config.getOrThrow<string>("JWT_SECRET"),
			});
			return payload?.sub && payload?.email ? payload : null;
		} catch {
			return null;
		}
	}

	async signRefreshToken(userId: string): Promise<{ token: string; id: string }> {
		const { nanoid } = await import("nanoid");
		const token = this.jwtService.sign(
			{ sub: userId },
			{
				secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
				expiresIn: 604800,
			},
		);
		const tokenHash = this.hashToken(token);
		const expiresInMs = this.parseExpiresIn(this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d");
		const expiresAt = new Date(Date.now() + expiresInMs);
		const id = nanoid(10);
		await this.db.insert(RefreshTokensTable).values({
			id,
			userId,
			tokenHash,
			expiresAt,
		});
		return { token, id };
	}

	async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
		try {
			const payload = this.jwtService.verify<{ sub: string }>(token, {
				secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
			});
			if (!payload?.sub) return null;
			const tokenHash = this.hashToken(token);
			const [row] = await this.db
				.select()
				.from(RefreshTokensTable)
				.where(
					and(
						eq(RefreshTokensTable.userId, payload.sub),
						eq(RefreshTokensTable.tokenHash, tokenHash),
						isNull(RefreshTokensTable.revokedAt),
						gt(RefreshTokensTable.expiresAt, new Date()),
					),
				)
				.limit(1);
			return row ? { userId: row.userId } : null;
		} catch {
			return null;
		}
	}

	async revokeRefreshToken(token: string): Promise<boolean> {
		const tokenHash = this.hashToken(token);
		const result = await this.db
			.update(RefreshTokensTable)
			.set({ revokedAt: new Date() })
			.where(eq(RefreshTokensTable.tokenHash, tokenHash))
			.returning({ id: RefreshTokensTable.id });
		return result.length > 0;
	}

	private hashToken(token: string): string {
		return createHash("sha256").update(token).digest("hex");
	}

	private parseExpiresIn(expiresIn: string): number {
		const match = expiresIn.match(/^(\d+)([smhd])$/);
		if (!match) return 7 * 24 * 60 * 60 * 1000;
		const value = Number(match[1]);
		const unit = match[2];
		const multipliers: Record<string, number> = {
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
		};
		return value * (multipliers[unit] ?? 86400000);
	}
}
