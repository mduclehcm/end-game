import { Controller, Get, Query } from "@nestjs/common";
import { LlmUsageService } from "./llm-usage.service";

@Controller("ai-usage")
export class AiUsageController {
	constructor(private readonly llmUsageService: LlmUsageService) {}

	@Get()
	async findAll(
		@Query("limit") limitParam?: string,
		@Query("offset") offsetParam?: string,
	): Promise<{ data: Awaited<ReturnType<LlmUsageService["findAll"]>> }> {
		const limit = limitParam != null ? Math.min(500, Math.max(1, Number(limitParam))) : 100;
		const offset = offsetParam != null ? Math.max(0, Number(offsetParam)) : 0;
		const data = await this.llmUsageService.findAll(limit, offset);
		return { data };
	}
}
