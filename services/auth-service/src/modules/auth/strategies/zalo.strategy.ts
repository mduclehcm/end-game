import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import type { Strategy as PassportStrategyType } from "passport";
import { Strategy } from "passport";
import { AuthService } from "../auth.service";

const ZALO_AUTH_URL = "https://oauth.zaloapp.com/v4/permission";
const ZALO_TOKEN_URL = "https://oauth.zaloapp.com/v4/access_token";
const ZALO_PROFILE_URL = "https://graph.zalo.me/v2.0/me";

export interface ZaloProfile {
	id: string;
	name?: string;
	picture?: { data?: { url?: string } };
}

function base64UrlEncode(buffer: Buffer): string {
	return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createCodeVerifier(): string {
	return base64UrlEncode(randomBytes(32));
}

function createCodeChallenge(verifier: string): string {
	return base64UrlEncode(createHash("sha256").update(verifier).digest());
}

@Injectable()
export class ZaloStrategy extends PassportStrategy(Strategy, "zalo") {
	private get passportStrategy(): PassportStrategyType {
		return this as unknown as PassportStrategyType;
	}

	constructor(private readonly authService: AuthService) {
		super();
	}

	authenticate(req: Request): void {
		const code = req.query?.code as string | undefined;
		const state = req.query?.state as string | undefined;
		const appId = process.env.ZALO_APP_ID;
		const appSecret = process.env.ZALO_APP_SECRET;
		const callbackURL = process.env.ZALO_CALLBACK_URL ?? "http://localhost:3001/auth/zalo/callback";

		if (!appId || !appSecret) {
			this.passportStrategy.fail({ message: "Zalo OAuth not configured" }, 500);
			return;
		}

		if (!code || !state) {
			const codeVerifier = createCodeVerifier();
			const codeChallenge = createCodeChallenge(codeVerifier);
			const statePayload = base64UrlEncode(
				Buffer.from(JSON.stringify({ v: codeVerifier, n: randomBytes(8).toString("hex") })),
			);
			const url = new URL(ZALO_AUTH_URL);
			url.searchParams.set("app_id", appId);
			url.searchParams.set("redirect_uri", callbackURL);
			url.searchParams.set("code_challenge", codeChallenge);
			url.searchParams.set("code_challenge_method", "S256");
			url.searchParams.set("state", statePayload);
			this.passportStrategy.redirect(url.toString());
			return;
		}

		let codeVerifier: string;
		try {
			const base64 = state.replace(/-/g, "+").replace(/_/g, "/");
			const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
			const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
			codeVerifier = decoded?.v;
			if (!codeVerifier) throw new Error("Invalid state");
		} catch {
			this.passportStrategy.fail({ message: "Invalid state" }, 400);
			return;
		}

		const tokenBody = new URLSearchParams({
			app_id: appId,
			app_secret: appSecret,
			code,
			code_verifier: codeVerifier,
			grant_type: "authorization_code",
		});

		fetch(ZALO_TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: tokenBody.toString(),
		})
			.then((res) => res.json() as Promise<{ access_token?: string }>)
			.then(async (data) => {
				const accessToken = data.access_token;
				if (!accessToken) return this.passportStrategy.fail({ message: "No access token from Zalo" }, 400);
				const profileRes = await fetch(`${ZALO_PROFILE_URL}?fields=id,name,picture`, {
					headers: { access_token: accessToken },
				});
				const profile = (await profileRes.json()) as ZaloProfile;
				if (!profile?.id) return this.passportStrategy.fail({ message: "Failed to load Zalo profile" }, 400);
				try {
					const user = await this.authService.findOrCreateUserFromZalo({
						providerUserId: profile.id,
						displayName: profile.name ?? "User",
						avatarUrl: profile.picture?.data?.url ?? null,
						accessToken,
					});
					return this.passportStrategy.success(user);
				} catch (err) {
					return this.passportStrategy.error(err as Error);
				}
			})
			.catch((err) => this.passportStrategy.error(err));
	}
}
