import type { DocumentDetail, UpdateDocumentPayload } from "@algo/cv-core";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DocumentRepository } from "../document.repository";

@Injectable()
export class UpdateDocumentUseCase {
	constructor(private readonly documentRepository: DocumentRepository) {}

	async execute(id: string, userId: string, payload: UpdateDocumentPayload): Promise<DocumentDetail> {
		const document = await this.documentRepository.update(id, userId, payload);
		if (!document) {
			throw new NotFoundException();
		}
		return document;
	}
}
