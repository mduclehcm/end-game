import { Injectable } from "@nestjs/common";
import type { ParsePdfService } from "../parse-pdf.service";
import type { ParsedResumeDto } from "../dto/parsed-resume.dto";

@Injectable()
export class ParsePdfUseCase {
	constructor(private readonly parsePdfService: ParsePdfService) {}

	async execute(buffer: Buffer): Promise<ParsedResumeDto> {
		return this.parsePdfService.parsePdf(buffer);
	}
}
