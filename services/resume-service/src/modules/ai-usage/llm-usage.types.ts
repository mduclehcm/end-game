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
}
