import { Module } from "@nestjs/common";
import { AiUsageController } from "./ai-usage.controller";
import { LlmUsageRepository } from "./llm-usage.repository";
import { LlmUsageService } from "./llm-usage.service";

@Module({
	controllers: [AiUsageController],
	providers: [LlmUsageService, LlmUsageRepository],
	exports: [LlmUsageService],
})
export class AiUsageModule {}
