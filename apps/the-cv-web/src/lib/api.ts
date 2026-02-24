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
