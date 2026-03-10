import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AiUsageModule } from "./modules/ai-usage/ai-usage.module";
import { DocumentModule } from "./modules/resume-data/document.module";

@Module({
	imports: [TerminusModule, DatabaseModule, AiUsageModule, DocumentModule],
	controllers: [HealthController],
})
export class ResumeModule {}
