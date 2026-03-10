import type {
	CreateDocumentPayload,
	CreateDocumentResponse,
	DeleteDocumentResponse,
	DocumentDetail,
	DocumentInfo,
	GetDocumentListResponse,
	GetDocumentResponse,
	UpdateDocumentResponse,
} from "@algo/cv-core";

const BASE_URL = "/api/v1";

export interface ParsedResumeResponse {
	title?: string;
	fieldValues: Record<string, string>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { "Content-Type": "application/json", ...init?.headers },
		...init,
	});
	if (!res.ok) {
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	return res.json() as Promise<T>;
}

export async function parsePdfResume(file: File): Promise<ParsedResumeResponse> {
	const formData = new FormData();
	formData.append("file", file);
	const res = await fetch(`${BASE_URL}/documents/parse-pdf`, {
		method: "POST",
		body: formData,
	});
	if (!res.ok) {
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	const json = (await res.json()) as { data: ParsedResumeResponse };
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

export function updateCloudDocument(id: string, fields: Record<string, string>): Promise<DocumentDetail> {
	return request<UpdateDocumentResponse>(`/documents/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ fields }),
	}).then((res) => res.data);
}

export function deleteCloudResumeDocument(id: string): Promise<boolean> {
	return request<DeleteDocumentResponse>(`/documents/${id}`, { method: "DELETE" }).then((res) => res.success);
}

export type RewriteFieldResult = { value: string } | DocumentDetail;

export type RewriteFieldPayload = {
	sectionId: string;
	entityId: string;
	fieldId: string;
	sectionKind: string;
	fieldKey: string;
	apply?: boolean;
};

export async function rewriteCloudField(id: string, payload: RewriteFieldPayload): Promise<RewriteFieldResult> {
	const body = { ...payload };
	// #region agent log
	const path = `${BASE_URL}/documents/${id}/rewrite-field`;
	fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
		method: "POST",
		headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
		body: JSON.stringify({
			sessionId: "c6e154",
			location: "api.ts:rewriteCloudField",
			message: "rewriteCloudField request",
			data: { path, id },
			timestamp: Date.now(),
			hypothesisId: "H4",
		}),
	}).catch(() => {});
	// #endregion
	const res = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	// #region agent log
	if (!res.ok) {
		const text = await res.text();
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
			body: JSON.stringify({
				sessionId: "c6e154",
				location: "api.ts:rewriteCloudField",
				message: "rewrite-field non-OK response",
				data: { status: res.status, statusText: res.statusText, body: text?.slice(0, 500) },
				timestamp: Date.now(),
				hypothesisId: "H1",
			}),
		}).catch(() => {});
		throw new Error(`API ${res.status}: ${res.statusText}`);
	}
	// #endregion
	const json = (await res.json()) as { data: { value: string } | DocumentDetail };
	return json.data;
}
