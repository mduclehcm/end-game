import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AiUsageModule } from "./modules/ai-usage/ai-usage.module";
import { DocumentModule } from "./modules/resume-data/document.module";
import { SystemPromptModule } from "./modules/system-prompt/system-prompt.module";

@Module({
	imports: [TerminusModule, DatabaseModule, AiUsageModule, SystemPromptModule, DocumentModule],
	controllers: [HealthController],
})
export class ResumeModule {}
