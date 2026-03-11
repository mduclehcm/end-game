import type { SectionKind } from "@domain";
import { getRewriteSystemPrompt } from "@domain";
import { Injectable } from "@nestjs/common";
import type { LlmClient, ParsedResumeResult } from "@ports";
import OpenAI from "openai";
import { LlmUsageService } from "../../ai-usage/llm-usage.service";

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
export class OpenAILlmAdapter implements LlmClient {
	private openai: OpenAI | null = null;

	constructor(private readonly llmUsageService: LlmUsageService) {
		const apiKey = process.env.OPENAI_API_KEY;
		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
		}
	}

	async extractResume(text: string): Promise<ParsedResumeResult | null> {
		if (!this.openai) return null;

		const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
		const userContent = `Extract resume data from this text:\n\n${text.slice(0, 12000)}`;
		const startMs = Date.now();

		const response = await this.openai.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: RESUME_EXTRACT_SYSTEM },
				{ role: "user", content: userContent },
			],
			response_format: { type: "json_object" },
		});

		const durationMs = Date.now() - startMs;
		const content = response.choices[0]?.message?.content;
		if (!content) throw new Error("Empty response from AI");

		this.llmUsageService
			.log({
				type: "parse-resume",
				model,
				fieldKey: null,
				systemPrompt: RESUME_EXTRACT_SYSTEM,
				userInput: userContent,
				output: content,
				inputTokens: response.usage?.prompt_tokens ?? 0,
				outputTokens: response.usage?.completion_tokens ?? 0,
				durationMs,
			})
			.catch(() => {});

		let parsed: { title?: string; fieldValues?: Record<string, string> };
		try {
			parsed = JSON.parse(content) as { title?: string; fieldValues?: Record<string, string> };
		} catch {
			throw new Error("Invalid JSON from AI");
		}

		const fieldValues = parsed.fieldValues ?? {};
		const normalized: Record<string, string> = {};
		for (const [k, v] of Object.entries(fieldValues)) {
			normalized[k] = v != null ? String(v) : "";
		}

		return {
			title: parsed.title != null ? String(parsed.title).slice(0, 50) : undefined,
			fieldValues: normalized,
		};
	}

	async rewrite(currentValue: string, sectionKind: string, fieldKey: string): Promise<string> {
		if (!this.openai) throw new Error("AI rewrite not configured");

		const kind = sectionKind.trim().toLowerCase();
		const key = fieldKey.trim();
		const systemPrompt = getRewriteSystemPrompt(kind as SectionKind, key);
		if (!systemPrompt) throw new Error("Rewrite not supported for this field");

		const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
		const startMs = Date.now();

		const response = await this.openai.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: currentValue },
			],
		});

		const durationMs = Date.now() - startMs;
		const content = response.choices[0]?.message?.content;
		const output = content != null ? content.trim() : "";

		this.llmUsageService
			.log({
				type: "rewrite-field",
				model,
				fieldKey: `${kind}.${key}`,
				systemPrompt,
				userInput: currentValue,
				output,
				inputTokens: response.usage?.prompt_tokens ?? 0,
				outputTokens: response.usage?.completion_tokens ?? 0,
				durationMs,
			})
			.catch(() => {});

		return output;
	}
}
