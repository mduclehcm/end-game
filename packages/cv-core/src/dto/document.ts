import type { DocumentDetail } from "../entity/document-detail";
import type { DocumentInfo } from "../entity/document-info";
import type { DeleteItemResponse, ListResponse, SingleResponse } from "./common";

export interface CreateDocumentPayload {
	title: string;
}

export interface UpdateDocumentPayload {
	title?: string;
	fields?: Record<string, string>;
}

export interface UpdateDocumentResponse extends SingleResponse<DocumentDetail> {}

export interface GetDocumentListResponse extends ListResponse<DocumentInfo> {}
export interface GetDocumentResponse extends SingleResponse<DocumentDetail> {}
export interface CreateDocumentResponse extends SingleResponse<DocumentDetail> {}
export interface DeleteDocumentResponse extends DeleteItemResponse {}
