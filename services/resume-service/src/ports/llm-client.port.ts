/**
 * Port for LLM operations (extract resume from text, rewrite field).
 * Implemented by OpenAI adapter.
 */
export interface LlmClient {
	/** Extract structured resume data from raw text. Returns null if LLM not configured. */
	extractResume(text: string): Promise<ParsedResumeResult | null>;

	/** Rewrite field content. Throws if LLM not configured or unsupported field. */
	rewrite(currentValue: string, sectionKind: string, fieldKey: string): Promise<string>;
}

export interface ParsedResumeResult {
	title?: string;
	fieldValues: Record<string, string>;
}
