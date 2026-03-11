import type { LlmUsageLog } from "@algo/cv-core";
import { Injectable } from "@nestjs/common";
import type { LlmUsageLogPayload } from "@ports";
import { LlmUsageRepository } from "./llm-usage.repository";

@Injectable()
export class LlmUsageService {
	constructor(private readonly repo: LlmUsageRepository) {}

	async findAll(limit = 100, offset = 0): Promise<LlmUsageLog[]> {
		return this.repo.findAll(limit, offset);
	}

	async log(payload: LlmUsageLogPayload): Promise<void> {
		await this.repo.log(payload);
	}
}
