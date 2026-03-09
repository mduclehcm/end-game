import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import type { ParsedResumeDto } from "./dto/parsed-resume.dto";

const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const RESUME_EXTRACT_SYSTEM = `You are a resume parser. Given raw text extracted from a PDF resume, output a JSON object that maps field keys to string values.

Use exactly these key names (use content.* for main content, settings.* for settings). Omit keys for missing or empty values.
Personal: content.personal.firstName, content.personal.lastName, content.personal.title, content.personal.email, content.personal.phone, content.personal.location, content.personal.postalCode, content.personal.country, content.personal.linkedin, content.personal.address, content.personal.nationality, content.personal.placeOfBirth, content.personal.drivingLicense, content.personal.dateOfBirth
Summary: content.summary.text
Experience (array, 0-based index): content.experience.N.position, content.experience.N.company, content.experience.N.startDate, content.experience.N.endDate, content.experience.N.location, content.experience.N.description
Education (array): content.education.N.institution, content.education.N.degree, content.education.N.startDate, content.education.N.endDate, content.education.N.city, content.education.N.description
Skills (array, one per item): content.skills.N.skill
Languages (array): content.languages.N.language
Settings: settings.templateId (use "default-simple"), settings.pageSize ("A4"), settings.pageMargins.top, .right, .bottom, .left (e.g. "20")

Also output an optional "title" string (e.g. "Resume" or the person's name + " Resume") for the document title.

Respond with a single JSON object: { "title": "...", "fieldValues": { "content.personal.firstName": "...", ... } }. No markdown, no code block.`;

@Injectable()
export class ParsePdfService {
	private openai: OpenAI | null = null;

	constructor() {
		const apiKey = process.env.OPENAI_API_KEY;
		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
		}
	}

	async parsePdf(buffer: Buffer): Promise<ParsedResumeDto> {
		if (buffer.length > MAX_PDF_SIZE_BYTES) {
			throw new Error("PDF file too large");
		}

		const text = await this.extractTextFromPdf(buffer);
		if (!text.trim()) {
			return { title: "Imported Resume", fieldValues: {} };
		}

		if (!this.openai) {
			// No API key: return minimal structure so frontend can still create doc
			return {
				title: "Imported Resume",
				fieldValues: { "content.summary.text": text.slice(0, 2000) },
			};
		}

		return this.parseResumeWithLlm(text);
	}

	private async extractTextFromPdf(buffer: Buffer): Promise<string> {
		const parser = new PDFParse({
			data: buffer,
		});
		const result = await parser.getText();
		return result.text;
	}

	private async parseResumeWithLlm(text: string): Promise<ParsedResumeDto> {
		if (!this.openai) throw new Error("OpenAI client not configured");

		const response = await this.openai.chat.completions.create({
			model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
			messages: [
				{ role: "system", content: RESUME_EXTRACT_SYSTEM },
				{ role: "user", content: `Extract resume data from this text:\n\n${text.slice(0, 12000)}` },
			],
			response_format: { type: "json_object" },
		});

		const content = response.choices[0]?.message?.content;
		if (!content) throw new Error("Empty response from AI");

		let parsed: { title?: string; fieldValues?: Record<string, string> };
		try {
			parsed = JSON.parse(content) as { title?: string; fieldValues?: Record<string, string> };
		} catch {
			throw new Error("Invalid JSON from AI");
		}

		const fieldValues = parsed.fieldValues ?? {};
		// Ensure all values are strings
		const normalized: Record<string, string> = {};
		for (const [k, v] of Object.entries(fieldValues)) {
			normalized[k] = v != null ? String(v) : "";
		}

		return {
			title: parsed.title != null ? String(parsed.title).slice(0, 50) : undefined,
			fieldValues: normalized,
		};
	}
}
