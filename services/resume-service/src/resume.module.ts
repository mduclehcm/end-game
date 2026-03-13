import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AiUsageModule } from "./modules/ai-usage/ai-usage.module";
import { ExportModule } from "./modules/export/export.module";
import { DocumentModule } from "./modules/resume-data/document.module";
import { SystemPromptModule } from "./modules/system-prompt/system-prompt.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
		}),
		TerminusModule,
		DatabaseModule,
		AiUsageModule,
		SystemPromptModule,
		DocumentModule,
		ExportModule,
	],
	controllers: [HealthController],
})
export class ResumeModule {}
