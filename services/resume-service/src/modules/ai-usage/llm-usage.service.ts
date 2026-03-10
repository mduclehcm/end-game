import { Injectable } from "@nestjs/common";
import type { LlmUsageLogRow } from "../../database/schema";
import { LlmUsageRepository } from "./llm-usage.repository";
import type { LlmUsageLogPayload } from "./llm-usage.types";

@Injectable()
export class LlmUsageService {
	constructor(private readonly repo: LlmUsageRepository) {}

	async findAll(limit = 100, offset = 0): Promise<LlmUsageLogRow[]> {
		return this.repo.findAll(limit, offset);
	}

	async log(payload: LlmUsageLogPayload): Promise<void> {
		await this.repo.create({
			type: payload.type,
			model: payload.model,
			fieldKey: payload.fieldKey ?? null,
			systemPrompt: payload.systemPrompt,
			userInput: payload.userInput,
			output: payload.output,
			inputTokens: payload.inputTokens,
			outputTokens: payload.outputTokens,
			durationMs: payload.durationMs,
		});
	}
}
