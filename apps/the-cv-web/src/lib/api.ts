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

export async function parsePdfResume(file: File): Promise<ParsedResumeDto> {
	const formData = new FormData();
	formData.append("file", file);
	const res = await fetch(`${BASE_URL}/documents/parse-pdf`, {
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
	const body = { ...payload };
	const path = `${BASE_URL}/documents/${id}/rewrite-field`;
	const res = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const json = (await res.json()) as { data: RewriteFieldResult };
	return json.data;
}
