import type { CreateDocumentPayload, DocumentDetail, DocumentInfo, UpdateDocumentPayload } from "@algo/cv-core";
import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { DocumentsTable } from "../../database/schema";
import { toDocumentDetail, toDocumentInfoList } from "./dto/utils";

@Injectable()
export class DocumentRepository {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async findAll(): Promise<DocumentInfo[]> {
		const results = await this.db.select().from(DocumentsTable);
		return toDocumentInfoList(results);
	}

	async findById(id: string): Promise<DocumentDetail | null> {
		const results = await this.db.select().from(DocumentsTable).where(eq(DocumentsTable.id, id));
		if (!results.length) {
			return null;
		}
		return toDocumentDetail(results[0]);
	}

	async create(payload: CreateDocumentPayload): Promise<DocumentDetail | null> {
		const { nanoid } = await import("nanoid");
		const results = await this.db
			.insert(DocumentsTable)
			.values({
				id: nanoid(10),
				title: payload.title,
				fields: {},
			})
			.returning();
		if (!results.length) {
			return null;
		}
		return toDocumentDetail(results[0]);
	}

	async update(id: string, payload: UpdateDocumentPayload): Promise<DocumentDetail | null> {
		const { fields, ...rest } = payload;
		const setData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
		if (fields) {
			setData.fields = sql`COALESCE(${DocumentsTable.fields}, '{}'::jsonb) || ${JSON.stringify(fields)}::jsonb`;
		}
		const results = await this.db.update(DocumentsTable).set(setData).where(eq(DocumentsTable.id, id)).returning();
		if (!results.length) {
			return null;
		}
		return toDocumentDetail(results[0]);
	}

	async remove(id: string) {
		const results = await this.db.delete(DocumentsTable).where(eq(DocumentsTable.id, id)).returning();
		if (!results.length) {
			return false;
		}
		return true;
	}
}
