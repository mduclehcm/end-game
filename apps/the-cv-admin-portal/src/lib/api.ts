import type { LlmUsageLog, SystemPromptDto } from "@algo/cv-core";
import { useAuthStore } from "@/store/auth-store";

const API_BASE = "/api/admin";

async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
	const { accessToken, refreshAuth, logout } = useAuthStore.getState();
	const headers = new Headers(init?.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	if (accessToken) {
		headers.set("Authorization", `Bearer ${accessToken}`);
	}
	const res = await fetch(url, { ...init, headers });
	if (res.status === 401) {
		await refreshAuth();
		const { accessToken: newToken } = useAuthStore.getState();
		if (newToken) {
			headers.set("Authorization", `Bearer ${newToken}`);
			const retryRes = await fetch(url, { ...init, headers });
			if (retryRes.ok) return retryRes;
			if (retryRes.status === 401) {
				await logout();
				window.location.assign("/login");
				throw new Error("Unauthorized");
			}
			return retryRes;
		}
		await logout();
		window.location.assign("/login");
		throw new Error("Unauthorized");
	}
	return res;
}

export async function fetchAiUsage(limit = 100, offset = 0, promptId?: string | null): Promise<LlmUsageLog[]> {
	const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
	if (promptId) params.set("promptId", promptId);
	const res = await authenticatedFetch(`${API_BASE}/ai-usage?${params}`);
	if (!res.ok) {
		throw new Error(`AI usage fetch failed: ${res.status}`);
	}
	const json = (await res.json()) as { data: LlmUsageLog[] };
	return json.data;
}

export async function fetchSystemPrompts(useCaseKey?: string): Promise<SystemPromptDto[]> {
	const params = useCaseKey ? new URLSearchParams({ useCaseKey }) : "";
	const url = `${API_BASE}/system-prompts${params ? `?${params}` : ""}`;
	const res = await authenticatedFetch(url);
	if (!res.ok) throw new Error(`System prompts fetch failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto[] };
	return json.data;
}

export async function createSystemPrompt(payload: {
	useCaseKey: string;
	name: string;
	promptParts?: { role?: string; guide?: string };
}): Promise<SystemPromptDto> {
	const res = await authenticatedFetch(`${API_BASE}/system-prompts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Create system prompt failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function activateSystemPrompt(id: string): Promise<SystemPromptDto> {
	const res = await authenticatedFetch(`${API_BASE}/system-prompts/${id}/activate`, { method: "PATCH" });
	if (!res.ok) throw new Error(`Activate system prompt failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function fetchSystemPrompt(id: string): Promise<SystemPromptDto> {
	const res = await authenticatedFetch(`${API_BASE}/system-prompts/${id}`);
	if (!res.ok) throw new Error(`System prompt fetch failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function updateSystemPrompt(
	id: string,
	payload: { name?: string; promptParts?: { role?: string; guide?: string } },
): Promise<SystemPromptDto> {
	const res = await authenticatedFetch(`${API_BASE}/system-prompts/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Update system prompt failed: ${res.status}`);
	const json = (await res.json()) as { data: SystemPromptDto };
	return json.data;
}

export async function deleteSystemPrompt(id: string): Promise<void> {
	const res = await authenticatedFetch(`${API_BASE}/system-prompts/${id}`, { method: "DELETE" });
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const msg = (body as { message?: string }).message ?? `Delete failed: ${res.status}`;
		throw new Error(msg);
	}
}

export interface AdminUser {
	id: string;
	email: string;
	username: string | null;
	displayName: string;
	avatarUrl: string | null;
	role: string;
	createdAt: string;
}

export async function fetchUsers(
	opts: { limit?: number; offset?: number; search?: string } = {},
): Promise<{ data: AdminUser[]; total: number }> {
	const params = new URLSearchParams();
	if (opts.limit) params.set("limit", String(opts.limit));
	if (opts.offset) params.set("offset", String(opts.offset));
	if (opts.search) params.set("search", opts.search);
	const res = await authenticatedFetch(`${API_BASE}/users?${params}`);
	if (!res.ok) throw new Error(`Fetch users failed: ${res.status}`);
	return res.json() as Promise<{ data: AdminUser[]; total: number }>;
}

export async function changeUserRole(userId: string, role: string): Promise<AdminUser> {
	const res = await authenticatedFetch(`${API_BASE}/users/${userId}/role`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ role }),
	});
	const json = await res.json().catch(() => ({}) as Record<string, unknown>);
	if (!res.ok) {
		throw new Error((json as { message?: string }).message ?? `Change role failed: ${res.status}`);
	}
	return (json as { data: AdminUser }).data;
}
