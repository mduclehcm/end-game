import { Module } from "@nestjs/common";
import { SystemPromptController } from "./system-prompt.controller";
import { SystemPromptRepository } from "./system-prompt.repository";
import { SystemPromptService } from "./system-prompt.service";

@Module({
	controllers: [SystemPromptController],
	providers: [SystemPromptService, SystemPromptRepository],
	exports: [SystemPromptService],
})
export class SystemPromptModule {}
