import { DocumentDetail, type DocumentInfo, DocumentSource } from "@algo/cv-core";
import type { DocumentRow } from "../../../database/schema";

export function toDocumentInfo(row: DocumentRow): DocumentInfo {
	return {
		id: row.id,
		title: row.title,
		source: DocumentSource.Cloud,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export function toDocumentInfoList(rows: DocumentRow[]): DocumentInfo[] {
	return rows.map(toDocumentInfo);
}

export function toDocumentDetail(row: DocumentRow): DocumentDetail {
	return {
		id: row.id,
		title: row.title,
		source: DocumentSource.Cloud,
		fields: row.fields,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}
