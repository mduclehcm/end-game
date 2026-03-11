import type { DocumentDetail } from "@algo/cv-core";
import { CreateDocumentPayload, UpdateDocumentPayload } from "@algo/cv-core";
import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateDocumentUseCase } from "./use-cases/create-document.use-case";
import { RewriteFieldUseCase } from "./use-cases/rewrite-field.use-case";
import { UpdateDocumentUseCase } from "./use-cases/update-document.use-case";
import { DocumentRepository } from "./document.repository";

@Injectable()
export class DocumentService {
	constructor(
		private readonly repository: DocumentRepository,
		private readonly createDocumentUseCase: CreateDocumentUseCase,
		private readonly updateDocumentUseCase: UpdateDocumentUseCase,
		private readonly rewriteFieldUseCase: RewriteFieldUseCase,
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
		return this.createDocumentUseCase.execute(payload);
	}

	async update(id: string, payload: UpdateDocumentPayload) {
		return this.updateDocumentUseCase.execute(id, payload);
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
		return this.rewriteFieldUseCase.execute({
			documentId: id,
			fieldId: payload.fieldId,
			sectionKind: payload.sectionKind,
			fieldKey: payload.fieldKey,
			apply: payload.apply,
		});
	}
}
