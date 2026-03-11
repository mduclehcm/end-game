/**
 * API contract schemas for ai-usage endpoints.
 * Used for validation and e2e contract baselines.
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
	createdAt: z.string(),
});

/** GET /ai-usage response */
export const GetAiUsageResponseSchema = z.object({
	data: z.array(LlmUsageLogEntrySchema),
});

export type GetAiUsageResponse = z.infer<typeof GetAiUsageResponseSchema>;
