import { Inject, Injectable } from "@nestjs/common";
import type { LlmClient } from "@ports";
import { LLM_CLIENT } from "@ports";
import { PDFParse } from "pdf-parse";
import type { ParsedResumeDto } from "./dto/parsed-resume.dto";

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class ParsePdfService {
	constructor(@Inject(LLM_CLIENT) private readonly llmClient: LlmClient) {}

	async parsePdf(buffer: Buffer): Promise<ParsedResumeDto> {
		if (buffer.length > MAX_PDF_SIZE_BYTES) {
			throw new Error("PDF file too large");
		}

		const text = await this.extractTextFromPdf(buffer);
		if (!text.trim()) {
			return { title: "Imported Resume", fieldValues: {} };
		}

		const result = await this.llmClient.extractResume(text);
		if (result) {
			return result;
		}

		// No API key: return minimal structure so frontend can still create doc
		return {
			title: "Imported Resume",
			fieldValues: { "content.summary.text": text.slice(0, 2000) },
		};
	}

	private async extractTextFromPdf(buffer: Buffer): Promise<string> {
		const parser = new PDFParse({
			data: buffer,
		});
		const result = await parser.getText();
		return result.text;
	}
}
