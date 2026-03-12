import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Profile } from "passport-google-oauth20";
import { Strategy } from "passport-google-oauth20";
import type { UserRow } from "../../../database/schema";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
	constructor(private readonly authService: AuthService) {
		super({
			clientID: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:3001/api/auth/google/callback",
			scope: ["email", "profile"],
		});
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile): Promise<UserRow> {
		return this.authService.findOrCreateUserFromGoogle({
			providerUserId: profile.id,
			email: profile.emails?.[0]?.value ?? `${profile.id}@google.user`,
			displayName: profile.displayName ?? profile.name?.givenName ?? "User",
			avatarUrl: profile.photos?.[0]?.value ?? null,
			accessToken,
			refreshToken: refreshToken || undefined,
		});
	}
}
