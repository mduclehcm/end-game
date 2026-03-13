import type { ExportInfo } from "@algo/cv-core";
import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import type * as schema from "../../database/schema";
import { ResumeExportDownloadTokensTable, type ResumeExportRow, ResumeExportsTable } from "../../database/schema";
import { shortId } from "../../database/short-id";
import { debugLog } from "./debug-log";

@Injectable()
export class ExportRepository {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async create(userId: string, documentId: string): Promise<ResumeExportRow> {
		const id = shortId(10);
		const [row] = await this.db
			.insert(ResumeExportsTable)
			.values({
				id,
				userId,
				documentId,
				status: "pending",
				format: "pdf",
			})
			.returning();
		if (!row) throw new Error("Export insert failed");
		// #region agent log
		const payloadCreate = {
			sessionId: "298113",
			location: "export.repository.ts:create",
			message: "Export created",
			data: { id: row.id, status: row.status },
			timestamp: Date.now(),
			hypothesisId: "H4",
		};
		debugLog(payloadCreate);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payloadCreate),
		}).catch(() => {});
		// #endregion
		return row;
	}

	async findAllByUserId(userId: string): Promise<ExportInfo[]> {
		const rows = await this.db
			.select()
			.from(ResumeExportsTable)
			.where(eq(ResumeExportsTable.userId, userId))
			.orderBy(desc(ResumeExportsTable.createdAt));
		return rows.map(toExportInfo);
	}

	async findById(id: string, userId: string): Promise<ResumeExportRow | null> {
		const [row] = await this.db
			.select()
			.from(ResumeExportsTable)
			.where(and(eq(ResumeExportsTable.id, id), eq(ResumeExportsTable.userId, userId)))
			.limit(1);
		return row ?? null;
	}

	async claimNextPending(): Promise<ResumeExportRow | null> {
		const [row] = await this.db
			.select()
			.from(ResumeExportsTable)
			.where(eq(ResumeExportsTable.status, "pending"))
			.orderBy(ResumeExportsTable.createdAt) // FIFO
			.limit(1);
		// #region agent log
		const payloadSelect = {
			sessionId: "298113",
			location: "export.repository.ts:claimNextPending",
			message: "Select pending result",
			data: { foundId: row?.id ?? null, hasRow: !!row },
			timestamp: Date.now(),
			hypothesisId: "H2",
		};
		debugLog(payloadSelect);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payloadSelect),
		}).catch(() => {});
		// #endregion
		if (!row) return null;
		const [updated] = await this.db
			.update(ResumeExportsTable)
			.set({ status: "processing", updatedAt: new Date() })
			.where(and(eq(ResumeExportsTable.id, row.id), eq(ResumeExportsTable.status, "pending")))
			.returning();
		// #region agent log
		const payloadUpdate = {
			sessionId: "298113",
			location: "export.repository.ts:claimNextPending:after-update",
			message: "Update claim result",
			data: { claimedId: updated?.id ?? null, claimed: !!updated },
			timestamp: Date.now(),
			hypothesisId: "H5",
		};
		debugLog(payloadUpdate);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payloadUpdate),
		}).catch(() => {});
		// #endregion
		return updated ?? null;
	}

	async markReady(
		id: string,
		payload: {
			storageBucket: string;
			storageKey: string;
			fileName: string;
			mimeType: string;
			sizeBytes: number;
		},
	): Promise<void> {
		const now = new Date();
		await this.db
			.update(ResumeExportsTable)
			.set({
				status: "ready",
				storageBucket: payload.storageBucket,
				storageKey: payload.storageKey,
				fileName: payload.fileName,
				mimeType: payload.mimeType,
				sizeBytes: payload.sizeBytes,
				updatedAt: now,
				completedAt: now,
			})
			.where(eq(ResumeExportsTable.id, id));
	}

	async markFailed(id: string, errorMessage: string): Promise<void> {
		const now = new Date();
		await this.db
			.update(ResumeExportsTable)
			.set({
				status: "failed",
				errorMessage,
				updatedAt: now,
				completedAt: now,
			})
			.where(eq(ResumeExportsTable.id, id));
	}

	async createDownloadToken(exportId: string, userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
		const id = shortId(10);
		await this.db.insert(ResumeExportDownloadTokensTable).values({
			id,
			exportId,
			userId,
			tokenHash,
			expiresAt,
		});
		return id;
	}

	/**
	 * Find token by exportId + tokenHash, ensure unused and not expired; mark used and return export row.
	 */
	async consumeTokenAndGetExport(exportId: string, tokenHash: string): Promise<ResumeExportRow | null> {
		const now = new Date();
		const tokens = await this.db
			.select()
			.from(ResumeExportDownloadTokensTable)
			.where(
				and(
					eq(ResumeExportDownloadTokensTable.exportId, exportId),
					eq(ResumeExportDownloadTokensTable.tokenHash, tokenHash),
					isNull(ResumeExportDownloadTokensTable.usedAt),
					gt(ResumeExportDownloadTokensTable.expiresAt, now),
				),
			)
			.limit(1);
		const token = tokens[0];
		if (!token) return null;
		await this.db
			.update(ResumeExportDownloadTokensTable)
			.set({ usedAt: now })
			.where(eq(ResumeExportDownloadTokensTable.id, token.id));
		const [exportRow] = await this.db
			.select()
			.from(ResumeExportsTable)
			.where(eq(ResumeExportsTable.id, exportId))
			.limit(1);
		return exportRow ?? null;
	}
}

function toExportInfo(row: ResumeExportRow): ExportInfo {
	return {
		id: row.id,
		documentId: row.documentId,
		status: row.status as ExportInfo["status"],
		format: row.format,
		fileName: row.fileName ?? null,
		sizeBytes: row.sizeBytes ?? null,
		errorMessage: row.errorMessage ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		completedAt: row.completedAt?.toISOString() ?? null,
	};
}
