import type { DocumentDetail } from "../schema/document-detail.schema";
import type { DocumentInfo } from "../schema/document-info.schema";
import type { DeleteItemResponse, ListResponse, SingleResponse } from "./common";

export interface CreateDocumentPayload {
	title: string;
	/** Path-based field values from import (e.g. "content.personal.firstName"). Server converts to full schema with section/entity/field ids. */
	fieldValues?: Record<string, string>;
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
