import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Strategy as PassportStrategyType } from "passport";
import { Strategy } from "passport";

/**
 * Stub strategy registered when Google OAuth env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) is not set.
 * Fails the request with 503 so routes stay defined but OAuth is disabled silently.
 */
@Injectable()
export class GoogleStrategyStub extends PassportStrategy(Strategy, "google") {
	private get passportStrategy(): PassportStrategyType {
		return this as unknown as PassportStrategyType;
	}

	authenticate(): void {
		this.passportStrategy.fail({ message: "Google OAuth is not configured" }, 503);
	}
}
