import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { RequireAdminGuard } from "../../guards/require-admin.guard";
import { LlmUsageService } from "./llm-usage.service";

function parseLimit(value: string | undefined, fallback: number): number {
	if (value === undefined || value === "") return fallback;
	const n = Number.parseInt(value, 10);
	if (Number.isNaN(n)) return fallback;
	return Math.min(500, Math.max(1, n));
}

function parseOffset(value: string | undefined, fallback: number): number {
	if (value === undefined || value === "") return fallback;
	const n = Number.parseInt(value, 10);
	if (Number.isNaN(n)) return fallback;
	return Math.max(0, n);
}

@Controller("admin/ai-usage")
@UseGuards(RequireAdminGuard)
export class AiUsageController {
	constructor(private readonly llmUsageService: LlmUsageService) {}

	@Get()
	async findAll(
		@Query("limit") limitParam?: string,
		@Query("offset") offsetParam?: string,
		@Query("promptId") promptId?: string,
	): Promise<{ data: Awaited<ReturnType<LlmUsageService["findAll"]>> }> {
		const limit = parseLimit(limitParam, 100);
		const offset = parseOffset(offsetParam, 0);
		const data = await this.llmUsageService.findAll(limit, offset, promptId ?? undefined);
		return { data };
	}
}
