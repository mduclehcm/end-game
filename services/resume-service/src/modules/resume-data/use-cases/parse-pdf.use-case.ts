import { Injectable } from "@nestjs/common";
import type { ParsedResumeDto } from "../dto/parsed-resume.dto";
import { ParsePdfService } from "../parse-pdf.service";

@Injectable()
export class ParsePdfUseCase {
	constructor(private readonly parsePdfService: ParsePdfService) {}

	async execute(buffer: Buffer): Promise<ParsedResumeDto> {
		return this.parsePdfService.parsePdf(buffer);
	}
}
