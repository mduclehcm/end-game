import { createHash, randomBytes } from "node:crypto";
import type { CreateExportResponse, ExportInfo } from "@algo/cv-core";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DocumentService } from "../resume-data/document.service";
import type { ObjectStoragePort } from "./export.port";
import { ExportRepository } from "./export.repository";

const DOWNLOAD_TOKEN_BYTES = 24;
const DOWNLOAD_TOKEN_TTL_SECONDS = 120;

@Injectable()
export class ExportService {
	constructor(
		private readonly exportRepository: ExportRepository,
		private readonly documentService: DocumentService,
		@Inject("OBJECT_STORAGE") private readonly storage: ObjectStoragePort,
	) {}

	async createExport(userId: string, documentId: string): Promise<CreateExportResponse["data"]> {
		await this.documentService.findById(documentId, userId);
		const row = await this.exportRepository.create(userId, documentId);
		return { id: row.id, status: "pending" };
	}

	async listExports(userId: string): Promise<ExportInfo[]> {
		return this.exportRepository.findAllByUserId(userId);
	}

	async getById(id: string, userId: string): Promise<ExportInfo> {
		const row = await this.exportRepository.findById(id, userId);
		if (!row) throw new NotFoundException();
		return toExportInfo(row);
	}

	async createDownloadLink(id: string, userId: string): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
		const row = await this.exportRepository.findById(id, userId);
		if (!row) throw new NotFoundException();
		if (row.status !== "ready" || !row.storageKey || !row.storageBucket) {
			throw new BadRequestException("Export is not ready for download");
		}
		const rawToken = randomBytes(DOWNLOAD_TOKEN_BYTES).toString("base64url");
		const tokenHash = hashToken(rawToken);
		const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_SECONDS * 1000);
		await this.exportRepository.createDownloadToken(id, userId, tokenHash, expiresAt);
		// Keep relative path so browser current domain is used (through Kong).
		const downloadUrl = `/api/resume/export-download?exportId=${encodeURIComponent(id)}&token=${encodeURIComponent(rawToken)}`;
		return {
			downloadUrl,
			expiresInSeconds: DOWNLOAD_TOKEN_TTL_SECONDS,
		};
	}

	async consumeTokenAndGetFile(
		exportId: string,
		token: string,
	): Promise<{ body: Buffer; fileName: string; contentType: string }> {
		const tokenHash = hashToken(token);
		const exportRow = await this.exportRepository.consumeTokenAndGetExport(exportId, tokenHash);
		if (!exportRow || exportRow.status !== "ready" || !exportRow.storageKey || !exportRow.storageBucket) {
			throw new BadRequestException("Invalid or expired download link");
		}
		const object = await this.storage.getObject(exportRow.storageBucket, exportRow.storageKey);
		return {
			body: object.body,
			fileName: exportRow.fileName ?? object.fileName ?? "export.pdf",
			contentType: object.contentType ?? "application/pdf",
		};
	}
}

function toExportInfo(row: {
	id: string;
	documentId: string;
	status: string;
	format: string;
	fileName: string | null;
	sizeBytes: number | null;
	errorMessage: string | null;
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
}): ExportInfo {
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

export function hashToken(raw: string): string {
	return createHash("sha256").update(raw, "utf8").digest("hex");
}
