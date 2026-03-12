import type {
	CreateDocumentPayload,
	CreateDocumentResponse,
	DeleteDocumentResponse,
	DocumentDetail,
	DocumentInfo,
	GetDocumentListResponse,
	GetDocumentResponse,
	ParsedResumeDto,
	RewriteFieldPayload,
	RewriteFieldResult,
	UpdateDocumentResponse,
} from "@algo/cv-core";
import { AUTH_REDIRECT_MAX, clearRedirectCount, incrementRedirectCount } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/auth-store";

const BASE_URL = "/api/resume";

async function authenticatedFetch(url: string, init?: RequestInit): Promise<Response> {
	const { accessToken, refreshAuth, logout } = useAuthStore.getState();
	const headers = new Headers(init?.headers);
	if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
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
			if (retryRes.ok) {
				clearRedirectCount();
				return retryRes;
			}
			if (retryRes.status === 401) {
				const count = incrementRedirectCount();
				if (count >= AUTH_REDIRECT_MAX) {
					await logout();
					clearRedirectCount();
					window.location.assign("/sign-in");
					throw new Error("Unauthorized");
				}
				const redirect = encodeURIComponent(window.location.pathname + window.location.search);
				window.location.assign(`/sign-in?redirect=${redirect}`);
				throw new Error("Unauthorized");
			}
			throw new Error(`API ${retryRes.status}: ${retryRes.statusText}`);
		}
		const count = incrementRedirectCount();
		if (count >= AUTH_REDIRECT_MAX) {
			await logout();
			clearRedirectCount();
			window.location.assign("/sign-in");
			throw new Error("Unauthorized");
		}
		const redirect = encodeURIComponent(window.location.pathname + window.location.search);
		window.location.assign(`/sign-in?redirect=${redirect}`);
		throw new Error("Unauthorized");
	}
	clearRedirectCount();
	return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await authenticatedFetch(`${BASE_URL}${path}`, init);
	if (!res.ok) {
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	return res.json() as Promise<T>;
}

export async function parsePdfResume(file: File): Promise<ParsedResumeDto> {
	const formData = new FormData();
	formData.append("file", file);
	const res = await authenticatedFetch(`${BASE_URL}/documents/parse-pdf`, {
		method: "POST",
		body: formData,
	});
	if (!res.ok) {
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	const json = (await res.json()) as { data: ParsedResumeDto };
	return json.data;
}

export function fetchCloudDocumentList(): Promise<DocumentInfo[]> {
	return request<GetDocumentListResponse>("/documents").then((res) => res.data);
}

export function fetchCloudDocumentDetail(id: string): Promise<DocumentDetail> {
	return request<GetDocumentResponse>(`/documents/${id}`).then((res) => res.data);
}

export function createCloudResumeDocument(payload: CreateDocumentPayload): Promise<DocumentDetail> {
	return request<CreateDocumentResponse>("/documents", {
		method: "POST",
		body: JSON.stringify(payload),
	}).then((res) => res.data);
}

/** Updates only the given field values (send changed fields only). */
export function updateCloudDocumentFields(id: string, changedFields: Record<string, string>): Promise<DocumentDetail> {
	return request<UpdateDocumentResponse>(`/documents/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ fields: changedFields }),
	}).then((res) => res.data);
}

export function updateCloudDocument(
	id: string,
	payload: {
		title?: string;
	},
): Promise<DocumentDetail> {
	return request<UpdateDocumentResponse>(`/documents/${id}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	}).then((res) => res.data);
}

export function deleteCloudResumeDocument(id: string): Promise<boolean> {
	return request<DeleteDocumentResponse>(`/documents/${id}`, { method: "DELETE" }).then((res) => res.success);
}

export async function rewriteCloudField(id: string, payload: RewriteFieldPayload): Promise<RewriteFieldResult> {
	const res = await authenticatedFetch(`${BASE_URL}/documents/${id}/rewrite-field`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	const json = (await res.json()) as { data: RewriteFieldResult };
	return json.data;
}
