import type {
	CreateDocumentPayload,
	DocumentData,
	DocumentDetail,
	DocumentInfo,
	UpdateDocumentPayload,
} from "@algo/cv-core";
import { Inject, Injectable } from "@nestjs/common";
import type { DocumentStore } from "@ports";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { DocumentsTable, FieldValuesTable } from "../../database/schema";
import { toDocumentDetail, toDocumentInfoList } from "./dto/utils";

@Injectable()
export class DocumentRepository implements DocumentStore {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async findAll(userId: string): Promise<DocumentInfo[]> {
		const results = await this.db
			.select()
			.from(DocumentsTable)
			.where(eq(DocumentsTable.userId, userId));
		return toDocumentInfoList(results);
	}

	async findById(id: string, userId: string): Promise<DocumentDetail | null> {
		const [docRow] = await this.db
			.select()
			.from(DocumentsTable)
			.where(and(eq(DocumentsTable.id, id), eq(DocumentsTable.userId, userId)))
			.limit(1);
		if (!docRow) return null;
		const valueRows = await this.db.select().from(FieldValuesTable).where(eq(FieldValuesTable.documentId, id));
		const fieldValues: Record<string, string> = {};
		for (const r of valueRows) {
			fieldValues[r.fieldId] = r.value;
		}
		return toDocumentDetail(docRow, fieldValues);
	}

	async create(
		payload: CreateDocumentPayload & { data?: DocumentData | null; userId: string },
	): Promise<DocumentDetail | null> {
		const { nanoid } = await import("nanoid");
		const data = payload.data ?? null;
		const structure = data ? { sectionIds: data.sectionIds, sections: data.sections } : null;
		const fieldValuesMap = data?.fieldValues ?? {};
		const docId = nanoid(10);
		const [inserted] = await this.db
			.insert(DocumentsTable)
			.values({
				id: docId,
				title: payload.title,
				userId: payload.userId,
				data: structure,
			})
			.returning();
		if (!inserted) return null;
		const now = new Date();
		if (Object.keys(fieldValuesMap).length > 0) {
			await this.db.insert(FieldValuesTable).values(
				Object.entries(fieldValuesMap).map(([fieldId, value]) => ({
					documentId: docId,
					fieldId,
					value: value ?? "",
					updatedAt: now,
				})),
			);
		}
		return toDocumentDetail(inserted, fieldValuesMap);
	}

	async update(id: string, userId: string, payload: UpdateDocumentPayload): Promise<DocumentDetail | null> {
		const { fields, title } = payload;
		await this.db.transaction(async (tx) => {
			if (title !== undefined) {
				await tx
					.update(DocumentsTable)
					.set({ title, updatedAt: new Date() })
					.where(and(eq(DocumentsTable.id, id), eq(DocumentsTable.userId, userId)));
			}
			if (fields !== undefined && Object.keys(fields).length > 0) {
				const now = new Date();
				for (const [fieldId, value] of Object.entries(fields)) {
					await tx
						.insert(FieldValuesTable)
						.values({ documentId: id, fieldId, value: value ?? "", updatedAt: now })
						.onConflictDoUpdate({
							target: [FieldValuesTable.documentId, FieldValuesTable.fieldId],
							set: { value: value ?? "", updatedAt: now },
						});
				}
			}
		});
		return this.findById(id, userId);
	}

	async remove(id: string, userId: string): Promise<boolean> {
		await this.db.delete(FieldValuesTable).where(eq(FieldValuesTable.documentId, id));
		const results = await this.db
			.delete(DocumentsTable)
			.where(and(eq(DocumentsTable.id, id), eq(DocumentsTable.userId, userId)))
			.returning();
		return results.length > 0;
	}
}
