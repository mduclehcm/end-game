import type { DocumentDetail } from "@algo/cv-core";
import { CreateDocumentPayload, UpdateDocumentPayload } from "@algo/cv-core";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DocumentRepository } from "./document.repository";
import { CreateDocumentUseCase } from "./use-cases/create-document.use-case";
import { RewriteFieldUseCase } from "./use-cases/rewrite-field.use-case";
import { UpdateDocumentUseCase } from "./use-cases/update-document.use-case";

@Injectable()
export class DocumentService {
	constructor(
		private readonly repository: DocumentRepository,
		private readonly createDocumentUseCase: CreateDocumentUseCase,
		private readonly updateDocumentUseCase: UpdateDocumentUseCase,
		private readonly rewriteFieldUseCase: RewriteFieldUseCase,
	) {}

	async findAll(userId: string) {
		return this.repository.findAll(userId);
	}

	async findById(id: string, userId: string) {
		const document = await this.repository.findById(id, userId);
		if (!document) {
			throw new NotFoundException();
		}
		return document;
	}

	async create(payload: CreateDocumentPayload, userId: string) {
		return this.createDocumentUseCase.execute(payload, userId);
	}

	async update(id: string, userId: string, payload: UpdateDocumentPayload) {
		return this.updateDocumentUseCase.execute(id, userId, payload);
	}

	async remove(id: string, userId: string) {
		const result = await this.repository.remove(id, userId);
		if (!result) {
			throw new NotFoundException();
		}
		return result;
	}

	async rewriteField(
		id: string,
		userId: string,
		payload: {
			sectionId: string;
			entityId: string;
			fieldId: string;
			sectionKind: string;
			fieldKey: string;
			apply?: boolean;
		},
	): Promise<{ value: string } | DocumentDetail> {
		return this.rewriteFieldUseCase.execute({
			documentId: id,
			userId,
			fieldId: payload.fieldId,
			sectionKind: payload.sectionKind,
			fieldKey: payload.fieldKey,
			apply: payload.apply,
		});
	}
}
