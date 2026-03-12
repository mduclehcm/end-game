import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Strategy as PassportStrategyType } from "passport";
import { Strategy } from "passport";

/**
 * Stub strategy registered when Zalo OAuth env (ZALO_APP_ID / ZALO_APP_SECRET) is not set.
 * Fails the request with 503 so routes stay defined but OAuth is disabled silently.
 */
@Injectable()
export class ZaloStrategyStub extends PassportStrategy(Strategy, "zalo") {
	private get passportStrategy(): PassportStrategyType {
		return this as unknown as PassportStrategyType;
	}

	authenticate(): void {
		this.passportStrategy.fail({ message: "Zalo OAuth is not configured" }, 503);
	}
}
