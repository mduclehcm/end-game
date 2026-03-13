import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { SystemPromptDto } from "./system-prompt.repository";
import { SystemPromptService } from "./system-prompt.service";

@Controller("admin/system-prompts")
export class SystemPromptController {
	constructor(private readonly systemPromptService: SystemPromptService) {}

	@Get()
	async findAll(@Query("useCaseKey") useCaseKey?: string): Promise<{ data: SystemPromptDto[] }> {
		const data = await this.systemPromptService.findAll(useCaseKey);
		return { data };
	}

	@Get(":id")
	async findOne(@Param("id") id: string): Promise<{ data: SystemPromptDto }> {
		const data = await this.systemPromptService.findOne(id);
		return { data };
	}

	@Post()
	async create(
		@Body() body: { useCaseKey: string; name: string; promptParts?: { role?: string; guide?: string } },
	): Promise<{ data: SystemPromptDto }> {
		const data = await this.systemPromptService.create({
			useCaseKey: body.useCaseKey,
			name: body.name,
			promptParts: body.promptParts ?? {},
		});
		return { data };
	}

	@Patch(":id")
	async update(
		@Param("id") id: string,
		@Body() body: { name?: string; promptParts?: { role?: string; guide?: string } },
	): Promise<{ data: SystemPromptDto }> {
		const data = await this.systemPromptService.update(id, body);
		return { data };
	}

	@Patch(":id/activate")
	async activate(@Param("id") id: string): Promise<{ data: SystemPromptDto }> {
		const data = await this.systemPromptService.activate(id);
		return { data };
	}

	@Delete(":id")
	async delete(@Param("id") id: string): Promise<{ data: null }> {
		await this.systemPromptService.delete(id);
		return { data: null };
	}
}
