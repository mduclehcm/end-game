import path from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";

function validate(config: Record<string, unknown>): Record<string, unknown> {
	const required = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"] as const;
	for (const key of required) {
		const v = config[key];
		if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
			throw new Error(`Fatal: ${key} must be set. Configure it in .env and restart the auth service.`);
		}
	}
	return config;
}

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: [
				path.join(process.cwd(), ".env"),
				path.resolve(process.cwd(), "../../.env"),
			],
			validate,
		}),
		TerminusModule,
		DatabaseModule,
		AuthModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
