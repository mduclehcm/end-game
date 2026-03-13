/**
 * API contract schemas for system-prompts (admin) endpoints.
 * Used for validation and e2e contract baselines.
 */

import { z } from "zod";

const SystemPromptEntrySchema = z.object({
	id: z.string(),
	useCaseKey: z.string(),
	name: z.string(),
	promptText: z.string(),
	promptParts: z.object({ role: z.string(), guide: z.string() }),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

/** GET /system-prompts response */
export const GetSystemPromptsResponseSchema = z.object({
	data: z.array(SystemPromptEntrySchema),
});

/** POST /system-prompts response */
export const CreateSystemPromptResponseSchema = z.object({
	data: SystemPromptEntrySchema,
});

/** PATCH /system-prompts/:id/activate response */
export const ActivateSystemPromptResponseSchema = z.object({
	data: SystemPromptEntrySchema,
});

/** DELETE /system-prompts/:id response */
export const DeleteSystemPromptResponseSchema = z.object({
	data: z.null(),
});

export type GetSystemPromptsResponse = z.infer<typeof GetSystemPromptsResponseSchema>;
export type CreateSystemPromptResponse = z.infer<typeof CreateSystemPromptResponseSchema>;
export type ActivateSystemPromptResponse = z.infer<typeof ActivateSystemPromptResponseSchema>;
export type DeleteSystemPromptResponse = z.infer<typeof DeleteSystemPromptResponseSchema>;
