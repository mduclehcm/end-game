import type { CreateDocumentPayload, DocumentData, DocumentDetail } from "@algo/cv-core";
import { convertPathFieldValuesToDocumentData } from "@domain";
import { Injectable } from "@nestjs/common";
import { DocumentRepository } from "../document.repository";

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
