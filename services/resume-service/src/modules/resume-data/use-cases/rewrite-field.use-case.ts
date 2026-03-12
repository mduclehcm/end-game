import type { DocumentDetail } from "@algo/cv-core";
import { isRewriteSupported } from "@algo/cv-core";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AiRewriteService } from "../ai-rewrite.service";
import { DocumentRepository } from "../document.repository";

export interface RewriteFieldInput {
	documentId: string;
	userId: string;
	fieldId: string;
	sectionKind: string;
	fieldKey: string;
	apply?: boolean;
}

@Injectable()
export class RewriteFieldUseCase {
	constructor(
		private readonly documentRepository: DocumentRepository,
		private readonly aiRewriteService: AiRewriteService,
	) {}

	async execute(input: RewriteFieldInput): Promise<{ value: string } | DocumentDetail> {
		const document = await this.documentRepository.findById(input.documentId, input.userId);
		if (!document) {
			throw new NotFoundException();
		}
		const currentValue = document.data?.fieldValues?.[input.fieldId];
		if (currentValue === undefined || currentValue === "") {
			throw new BadRequestException("Field has no content to rewrite");
		}
		if (!isRewriteSupported(input.sectionKind, input.fieldKey)) {
			throw new BadRequestException("Rewrite not supported for this field");
		}
		const value = await this.aiRewriteService.rewrite(currentValue, input.sectionKind, input.fieldKey);
		if (input.apply === true) {
			const updated = await this.documentRepository.update(
				input.documentId,
				input.userId,
				{ fields: { [input.fieldId]: value } },
			);
			if (!updated) throw new NotFoundException();
			return updated;
		}
		return { value };
	}
}
