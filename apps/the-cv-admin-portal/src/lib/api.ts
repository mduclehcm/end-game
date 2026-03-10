const API_BASE = "/api";

export async function fetchAiUsage(limit = 100, offset = 0): Promise<LlmUsageLog[]> {
	const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
	const res = await fetch(`${API_BASE}/ai-usage?${params}`);
	if (!res.ok) {
		throw new Error(`AI usage fetch failed: ${res.status}`);
	}
	const json = (await res.json()) as { data: LlmUsageLog[] };
	return json.data;
}

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
