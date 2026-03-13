import type { DocumentDetail } from "../schema/document-detail.schema";

/**
 * Response shape for POST /documents/parse-pdf.
 * Shared between backend (resume-service) and frontend (the-cv-web).
 */
export interface ParsedResumeDto {
	title?: string;
	fieldValues: Record<string, string>;
}

/**
 * Request payload for POST /documents/:id/rewrite-field.
 * Shared between backend and frontend.
 */
export interface RewriteFieldPayload {
	sectionId: string;
	entityId: string;
	fieldId: string;
	/** Section kind (e.g. summary, experience, education) for AI prompt selection. */
	sectionKind: string;
	/** Field key (e.g. text, description) for AI prompt selection. */
	fieldKey: string;
	/** If true, apply the rewritten value to the document; otherwise return preview only. */
	apply?: boolean;
}

/**
 * Response for POST /documents/:id/rewrite-field.
 * Preview: { value: string }. Apply: full DocumentDetail.
 */
export type RewriteFieldResult = { value: string } | DocumentDetail;

/**
 * System prompt entity (GET /system-prompts, PATCH /system-prompts/:id/activate response).
 * Final prompt = role + guide. Output structure is injected by backend per use case (e.g. parse-resume field list).
 */
export interface SystemPromptDto {
	id: string;
	useCaseKey: string;
	name: string;
	/** Prompt text = role + guide (concatenated with "\n\n"). */
	promptText: string;
	/** Editable parts: role, guide. */
	promptParts: { role: string; guide: string };
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Request body for POST /system-prompts.
 */
export interface CreateSystemPromptPayload {
	useCaseKey: string;
	name: string;
	/** Parts to concatenate into the prompt (role, guide). */
	promptParts?: { role?: string; guide?: string };
}

/**
 * One entry from GET /ai-usage response (data array item).
 * Shared between backend and frontend (admin portal).
 */
export interface LlmUsageLog {
	id: string;
	type: string;
	model: string;
	fieldKey: string | null;
	systemPrompt: string;
	userInput: string;
	output: string;
	inputTokens: number;
	outputTokens: number;
	durationMs: number;
	/** Id of the system prompt used, if any. */
	promptId: string | null;
	/** Use-case key of the prompt (e.g. parse-resume, rewrite.summary.text). */
	promptUseCaseKey: string | null;
	createdAt: string;
}
