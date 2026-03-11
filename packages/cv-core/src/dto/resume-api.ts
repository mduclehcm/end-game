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
	createdAt: string;
}
