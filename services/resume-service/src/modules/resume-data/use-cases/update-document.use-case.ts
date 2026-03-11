import type { DocumentDetail, UpdateDocumentPayload } from "@algo/cv-core";
import { Injectable, NotFoundException } from "@nestjs/common";
import type { DocumentRepository } from "../document.repository";

@Injectable()
export class UpdateDocumentUseCase {
	constructor(private readonly documentRepository: DocumentRepository) {}

	async execute(id: string, payload: UpdateDocumentPayload): Promise<DocumentDetail> {
		const document = await this.documentRepository.update(id, payload);
		if (!document) {
			throw new NotFoundException();
		}
		return document;
	}
}
