import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GoogleStrategyStub } from "./strategies/google-strategy.stub";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { ZaloStrategy } from "./strategies/zalo.strategy";
import { ZaloStrategyStub } from "./strategies/zalo-strategy.stub";
import { TokenService } from "./token.service";
import { UserRepository } from "./user.repository";

function hasGoogleOAuthConfig(): boolean {
	const id = process.env.GOOGLE_CLIENT_ID;
	const secret = process.env.GOOGLE_CLIENT_SECRET;
	return Boolean(id && secret && id.trim() !== "" && secret.trim() !== "");
}

function hasZaloOAuthConfig(): boolean {
	const appId = process.env.ZALO_APP_ID;
	const appSecret = process.env.ZALO_APP_SECRET;
	return Boolean(appId && appSecret && appId.trim() !== "" && appSecret.trim() !== "");
}

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "jwt" }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				secret: config.getOrThrow<string>("JWT_SECRET"),
				signOptions: { expiresIn: 900 },
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		TokenService,
		UserRepository,
		LocalStrategy,
		JwtStrategy,
		hasGoogleOAuthConfig() ? GoogleStrategy : GoogleStrategyStub,
		hasZaloOAuthConfig() ? ZaloStrategy : ZaloStrategyStub,
	],
	exports: [AuthService, TokenService],
})
export class AuthModule {}
