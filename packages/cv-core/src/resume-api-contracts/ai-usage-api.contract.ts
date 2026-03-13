/**
 * API contract schemas for ai-usage endpoints.
 * Used for validation and e2e contract baselines.
 * Shared between backend (resume-service) and frontend (the-cv-web).
 */

import { z } from "zod";

const LlmUsageLogEntrySchema = z.object({
	id: z.string(),
	type: z.string(),
	model: z.string(),
	fieldKey: z.string().nullable(),
	systemPrompt: z.string(),
	userInput: z.string(),
	output: z.string(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	durationMs: z.number(),
	promptId: z.string().nullable(),
	promptUseCaseKey: z.string().nullable(),
	createdAt: z.string(),
});

/** GET /ai-usage response */
export const GetAiUsageResponseSchema = z.object({
	data: z.array(LlmUsageLogEntrySchema),
});

export type GetAiUsageResponse = z.infer<typeof GetAiUsageResponseSchema>;
