import { ConflictException, Injectable } from "@nestjs/common";
import { hash } from "bcryptjs";
import type { UserRow } from "../../database/schema";
import type { AuthResponseDto } from "./dto/auth-response.dto";
import { TokenService } from "./token.service";
import { UserRepository } from "./user.repository";

export interface RegisterPayload {
	email: string;
	username?: string | null;
	password: string;
	displayName?: string;
}

export interface GoogleOAuthPayload {
	providerUserId: string;
	email: string;
	displayName: string;
	avatarUrl?: string | null;
	accessToken: string;
	refreshToken?: string;
}

export interface ZaloOAuthPayload {
	providerUserId: string;
	displayName: string;
	avatarUrl?: string | null;
	accessToken: string;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly tokenService: TokenService,
	) {}

	async register(payload: RegisterPayload): Promise<AuthResponseDto> {
		const existingEmail = await this.userRepository.findByEmail(payload.email);
		if (existingEmail) throw new ConflictException("Email already registered");
		if (payload.username) {
			const existingUsername = await this.userRepository.findByUsername(payload.username);
			if (existingUsername) throw new ConflictException("Username already taken");
		}
		const passwordHash = await hash(payload.password, 10);
		const user = await this.userRepository.create({
			email: payload.email,
			username: payload.username ?? null,
			passwordHash,
			displayName: payload.displayName ?? "",
		});
		return this.buildAuthResponse(user);
	}

	async login(user: UserRow): Promise<AuthResponseDto> {
		return this.buildAuthResponse(user);
	}

	async findOrCreateUserFromGoogle(payload: GoogleOAuthPayload): Promise<UserRow> {
		const existing = await this.userRepository.findOAuthAccount("google", payload.providerUserId);
		if (existing) {
			const user = await this.userRepository.findById(existing.userId);
			if (!user) throw new Error("User not found");
			await this.userRepository.upsertOAuthAccount({
				userId: user.id,
				provider: "google",
				providerUserId: payload.providerUserId,
				accessToken: payload.accessToken,
				refreshToken: payload.refreshToken ?? null,
			});
			return user;
		}
		let user = await this.userRepository.findByEmail(payload.email);
		if (!user) {
			user = await this.userRepository.create({
				email: payload.email,
				displayName: payload.displayName,
				avatarUrl: payload.avatarUrl,
			});
		}
		await this.userRepository.upsertOAuthAccount({
			userId: user.id,
			provider: "google",
			providerUserId: payload.providerUserId,
			accessToken: payload.accessToken,
			refreshToken: payload.refreshToken ?? null,
		});
		return user;
	}

	async findOrCreateUserFromZalo(payload: ZaloOAuthPayload): Promise<UserRow> {
		const existing = await this.userRepository.findOAuthAccount("zalo", payload.providerUserId);
		if (existing) {
			const user = await this.userRepository.findById(existing.userId);
			if (!user) throw new Error("User not found");
			await this.userRepository.upsertOAuthAccount({
				userId: user.id,
				provider: "zalo",
				providerUserId: payload.providerUserId,
				accessToken: payload.accessToken,
			});
			return user;
		}
		const email = `zalo.${payload.providerUserId}@zalo.user`;
		let user = await this.userRepository.findByEmail(email);
		if (!user) {
			user = await this.userRepository.create({
				email,
				displayName: payload.displayName,
				avatarUrl: payload.avatarUrl,
			});
		}
		await this.userRepository.upsertOAuthAccount({
			userId: user.id,
			provider: "zalo",
			providerUserId: payload.providerUserId,
			accessToken: payload.accessToken,
		});
		return user;
	}

	async refresh(refreshToken: string): Promise<AuthResponseDto | null> {
		const result = await this.tokenService.verifyRefreshToken(refreshToken);
		if (!result) return null;
		const user = await this.userRepository.findById(result.userId);
		if (!user) return null;
		await this.tokenService.revokeRefreshToken(refreshToken);
		return this.buildAuthResponse(user);
	}

	async logout(refreshToken: string): Promise<boolean> {
		return this.tokenService.revokeRefreshToken(refreshToken);
	}

	async getUserById(id: string): Promise<UserRow | null> {
		return this.userRepository.findById(id);
	}

	private async buildAuthResponse(user: UserRow): Promise<AuthResponseDto> {
		const accessToken = this.tokenService.signAccessToken({ sub: user.id, email: user.email });
		const { token: refreshToken } = await this.tokenService.signRefreshToken(user.id);
		const expiresIn = 15 * 60;
		return {
			accessToken,
			refreshToken,
			expiresIn,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl,
			},
		};
	}
}
