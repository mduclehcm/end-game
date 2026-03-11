import type {
	CreateDocumentPayload,
	DocumentData,
	DocumentDetail,
	DocumentInfo,
	UpdateDocumentPayload,
} from "@algo/cv-core";

/**
 * Port for document persistence.
 * Implemented by DocumentRepository (Drizzle/Postgres).
 */
export interface DocumentStore {
	findAll(): Promise<DocumentInfo[]>;
	findById(id: string): Promise<DocumentDetail | null>;
	create(payload: CreateDocumentPayload & { data?: DocumentData | null }): Promise<DocumentDetail | null>;
	update(id: string, payload: UpdateDocumentPayload): Promise<DocumentDetail | null>;
	remove(id: string): Promise<boolean>;
}
