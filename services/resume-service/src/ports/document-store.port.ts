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
 * All methods are scoped by userId (current user from JWT/Kong header).
 */
export interface DocumentStore {
	findAll(userId: string): Promise<DocumentInfo[]>;
	findById(id: string, userId: string): Promise<DocumentDetail | null>;
	create(
		payload: CreateDocumentPayload & { data?: DocumentData | null; userId: string },
	): Promise<DocumentDetail | null>;
	update(id: string, userId: string, payload: UpdateDocumentPayload): Promise<DocumentDetail | null>;
	remove(id: string, userId: string): Promise<boolean>;
}
