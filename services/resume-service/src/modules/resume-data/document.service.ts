import type { DocumentDetail } from "@algo/cv-core";
import { CreateDocumentPayload, UpdateDocumentPayload } from "@algo/cv-core";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AiRewriteService } from "./ai-rewrite.service";
import { convertPathFieldValuesToDocumentData } from "./convert-path-to-document-data";
import { DocumentRepository } from "./document.repository";

@Injectable()
export class DocumentService {
	constructor(
		private readonly repository: DocumentRepository,
		private readonly aiRewriteService: AiRewriteService,
	) {}

	async findAll() {
		return this.repository.findAll();
	}

	async findById(id: string) {
		const document = await this.repository.findById(id);
		if (!document) {
			throw new NotFoundException();
		}
		return document;
	}

	async create(payload: CreateDocumentPayload) {
		const data =
			payload.fieldValues && Object.keys(payload.fieldValues).length > 0
				? await convertPathFieldValuesToDocumentData(payload.fieldValues)
				: undefined;
		// #region agent log
		const fs = await import("fs");
		const logEntry =
			JSON.stringify({
				sessionId: "d54723",
				location: "document.service.ts:create",
				message: "create called",
				data: {
					hasFieldValues: !!(payload.fieldValues && Object.keys(payload.fieldValues).length > 0),
					fieldValuesCount: payload.fieldValues ? Object.keys(payload.fieldValues).length : 0,
					convertedSections: data
						? data.sections.map((s) => ({
								kind: s.kind,
								entityCount: s.entities.length,
								entityIdCount: s.entityIds.length,
							}))
						: null,
				},
				timestamp: Date.now(),
				hypothesisId: "H1",
			}) + "\n";
		fs.appendFileSync("/Users/duclm27/Sources/algovn/.cursor/debug-d54723.log", logEntry);
		// #endregion
		return this.repository.create({
			title: payload.title,
			data: data ?? null,
		});
	}

	async update(id: string, payload: UpdateDocumentPayload) {
		const document = await this.repository.update(id, payload);
		if (!document) {
			throw new NotFoundException();
		}
		return document;
	}

	async remove(id: string) {
		const result = await this.repository.remove(id);
		if (!result) {
			throw new NotFoundException();
		}
		return result;
	}

	async rewriteField(
		id: string,
		payload: {
			sectionId: string;
			entityId: string;
			fieldId: string;
			sectionKind: string;
			fieldKey: string;
			apply?: boolean;
		},
	): Promise<{ value: string } | DocumentDetail> {
		// #region agent log
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
			body: JSON.stringify({
				sessionId: "c6e154",
				location: "document.service.ts:rewriteField",
				message: "rewriteField entered",
				data: { id, fieldId: payload.fieldId },
				timestamp: Date.now(),
				hypothesisId: "H2",
			}),
		}).catch(() => {});
		// #endregion
		const document = await this.findById(id);
		const currentValue = document.data?.fieldValues?.[payload.fieldId];
		if (currentValue === undefined || currentValue === "") {
			throw new BadRequestException("Field has no content to rewrite");
		}
		const value = await this.aiRewriteService.rewrite(currentValue, payload.sectionKind, payload.fieldKey);
		if (payload.apply === true) {
			const updated = await this.repository.update(id, {
				fields: { [payload.fieldId]: value },
			});
			if (!updated) throw new NotFoundException();
			return updated;
		}
		return { value };
	}
}
