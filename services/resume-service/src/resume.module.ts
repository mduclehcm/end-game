import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { DocumentModule } from "./modules/resume-data/document.module";

@Module({
	imports: [TerminusModule, DatabaseModule, DocumentModule],
	controllers: [HealthController],
})
export class ResumeModule {}
