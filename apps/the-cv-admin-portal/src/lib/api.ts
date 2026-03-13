import type { LlmUsageLog, SystemPromptDto } from "@algo/cv-core";

const API_BASE = "/api/admin";

export async function fetchAiUsage(limit = 100, offset = 0, promptId?: string | null): Promise<LlmUsageLog[]> {
	const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
	if (promptId) params.set("promptId", promptId);
	const res = await fetch(`${API_BASE}/ai-usage?${params}`);
	if (!res.ok) {
		throw new Error(`AI usage fetch failed: ${res.status}`);
	}
	const json = (await res.json()) as { data: LlmUsageLog[] };
	return json.data;
}

export async function fetchSystemPrompts(useCaseKey?: string): Promise<SystemPromptDto[]> {
	const params = useCaseKey ? new URLSearchParams({ useCaseKey }) : "";
	const url = `${API_BASE}/system-prompts${params ? `?${params}` : ""}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`System prompts fetch failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto[] };
	return json.data;
}

export async function createSystemPrompt(payload: {
	useCaseKey: string;
	name: string;
	promptParts?: { role?: string; guide?: string };
}): Promise<SystemPromptDto> {
	const res = await fetch(`${API_BASE}/system-prompts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Create system prompt failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function activateSystemPrompt(id: string): Promise<SystemPromptDto> {
	const res = await fetch(`${API_BASE}/system-prompts/${id}/activate`, { method: "PATCH" });
	if (!res.ok) throw new Error(`Activate system prompt failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function fetchSystemPrompt(id: string): Promise<SystemPromptDto> {
	const res = await fetch(`${API_BASE}/system-prompts/${id}`);
	if (!res.ok) throw new Error(`System prompt fetch failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function updateSystemPrompt(
	id: string,
	payload: { name?: string; promptParts?: { role?: string; guide?: string } },
): Promise<SystemPromptDto> {
	const res = await fetch(`${API_BASE}/system-prompts/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Update system prompt failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function deleteSystemPrompt(id: string): Promise<void> {
	const res = await fetch(`${API_BASE}/system-prompts/${id}`, { method: "DELETE" });
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const msg = (body as { message?: string }).message ?? `Delete failed: ${res.status}`;
		throw new Error(msg);
	}
}
