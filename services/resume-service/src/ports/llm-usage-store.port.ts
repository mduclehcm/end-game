/**
 * Port for LLM usage logging persistence.
 * Implemented by LlmUsageRepository (Drizzle/Postgres).
 */
import type { LlmUsageLog } from "@algo/cv-core";

export interface LlmUsageLogPayload {
	type: string;
	model: string;
	fieldKey?: string | null;
	systemPrompt: string;
	userInput: string;
	output: string;
	inputTokens: number;
	outputTokens: number;
	durationMs: number;
	promptId?: string | null;
	promptUseCaseKey?: string | null;
}

/**
 * Port for LLM usage logging persistence.
 * Implemented by LlmUsageRepository (Drizzle/Postgres).
 */
export interface LlmUsageStore {
	findAll(limit: number, offset: number, promptId?: string | null): Promise<LlmUsageLog[]>;
	log(payload: LlmUsageLogPayload): Promise<void>;
}
