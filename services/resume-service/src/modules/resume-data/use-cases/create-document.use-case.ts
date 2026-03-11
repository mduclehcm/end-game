import type { CreateDocumentPayload, DocumentData } from "@algo/cv-core";
import type { DocumentDetail } from "@algo/cv-core";
import { Injectable } from "@nestjs/common";
import { convertPathFieldValuesToDocumentData } from "@domain";
import type { DocumentRepository } from "../document.repository";

@Injectable()
export class CreateDocumentUseCase {
	constructor(private readonly documentRepository: DocumentRepository) {}

	async execute(payload: CreateDocumentPayload): Promise<DocumentDetail | null> {
		const data: DocumentData | null =
			payload.fieldValues && Object.keys(payload.fieldValues).length > 0
				? await convertPathFieldValuesToDocumentData(payload.fieldValues)
				: null;
		return this.documentRepository.create({
			title: payload.title,
			data,
		});
	}
}