import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AccessTokenPayload } from "../token.service";

export interface JwtPayload extends AccessTokenPayload {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
		});
	}

	async validate(payload: AccessTokenPayload): Promise<JwtPayload> {
		if (!payload?.sub || !payload?.email) throw new UnauthorizedException("Invalid token");
		return { sub: payload.sub, email: payload.email };
	}
}
