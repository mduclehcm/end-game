import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { buildPromptText, type SystemPromptRow } from "../../database/schema";
import type { CreateSystemPromptDto, SystemPromptDto } from "./system-prompt.repository";
import { SystemPromptRepository } from "./system-prompt.repository";

@Injectable()
export class SystemPromptService {
	constructor(private readonly repo: SystemPromptRepository) {}

	async findAll(useCaseKey?: string): Promise<SystemPromptDto[]> {
		return this.repo.findAll(useCaseKey);
	}

	async create(dto: CreateSystemPromptDto): Promise<SystemPromptDto> {
		const row = await this.repo.create({
			useCaseKey: dto.useCaseKey.trim(),
			name: dto.name.trim(),
			roleText: (dto.promptParts?.role ?? "").trim(),
			guideText: (dto.promptParts?.guide ?? "").trim(),
			isActive: false,
		});
		return this.toDto(row);
	}

	async activate(id: string): Promise<SystemPromptDto> {
		const row = await this.repo.findById(id);
		if (!row) throw new NotFoundException("System prompt not found");
		await this.repo.setActive(id);
		const updated = await this.repo.findById(id);
		if (!updated) throw new NotFoundException("System prompt not found");
		return this.toDto(updated);
	}

	async findOne(id: string): Promise<SystemPromptDto> {
		const row = await this.repo.findById(id);
		if (!row) throw new NotFoundException("System prompt not found");
		return this.toDto(row);
	}

	async update(
		id: string,
		dto: { name?: string; promptParts?: { role?: string; guide?: string } },
	): Promise<SystemPromptDto> {
		const row = await this.repo.findById(id);
		if (!row) throw new NotFoundException("System prompt not found");
		const updated = await this.repo.update(id, dto);
		return this.toDto(updated);
	}

	async delete(id: string): Promise<void> {
		const row = await this.repo.findById(id);
		if (!row) throw new NotFoundException("System prompt not found");
		if (row.isActive) {
			throw new BadRequestException(
				"Cannot delete the active prompt. Activate another prompt for this use case first.",
			);
		}
		await this.repo.delete(id);
	}

	/** Resolve active prompt for a use-case key (for LLM adapter). */
	async getActivePrompt(useCaseKey: string): Promise<{ id: string; promptText: string } | null> {
		return this.repo.findActiveByUseCaseKey(useCaseKey);
	}

	private toDto(row: SystemPromptRow): SystemPromptDto {
		return {
			id: row.id,
			useCaseKey: row.useCaseKey,
			name: row.name,
			promptText: buildPromptText({ roleText: row.roleText, guideText: row.guideText }),
			promptParts: { role: row.roleText, guide: row.guideText },
			isActive: row.isActive,
			createdAt: typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
			updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : row.updatedAt.toISOString(),
		};
	}
}
