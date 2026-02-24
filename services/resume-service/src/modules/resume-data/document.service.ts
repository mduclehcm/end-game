import { CreateDocumentPayload, UpdateDocumentPayload } from "@algo/cv-core";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DocumentRepository } from "./document.repository";

@Injectable()
export class DocumentService {
	constructor(private readonly repository: DocumentRepository) {}

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
		return this.repository.create(payload);
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
}
