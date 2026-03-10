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

export function toDocumentDetail(row: DocumentRow, fieldValues: Record<string, string> = {}): DocumentDetail {
	const data = row.data ?? null;
	return {
		id: row.id,
		title: row.title,
		source: DocumentSource.Cloud,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		data: data
			? { sectionIds: data.sectionIds, sections: data.sections, fieldValues }
			: { sectionIds: [], sections: [], fieldValues },
	};
}
