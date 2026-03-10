import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";
import { LlmUsageService } from "../ai-usage/llm-usage.service";

const CONTENT_PREFIX = "content.";
const SETTINGS_PREFIX = "settings.";
const STATIC_SECTIONS = ["personal", "summary"] as const;
const ARRAY_SECTIONS = ["experience", "education", "skills", "languages"] as const;
const SECTION_KINDS = [...STATIC_SECTIONS, ...ARRAY_SECTIONS, "settings", "unknown"] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

export interface ParsedFieldId {
	section: SectionKind;
	entityIndex: number | null;
	fieldName: string;
}

const REWRITE_PROMPTS: Record<string, string> = {
	"summary.text": `You are a professional resume editor. Rewrite the following professional summary to be more concise, impactful, and ATS-friendly. Keep the same tone and key points. Output only the rewritten text, no explanations.`,
	"experience.description": `You are a professional resume editor. Rewrite the following job description bullets to use strong action verbs, quantify achievements where possible, and keep the same structure (bullets or paragraphs). Output only the rewritten text, no explanations.`,
	"education.description": `You are a professional resume editor. Rewrite the following education description to use clear, professional language and keep the same structure. Output only the rewritten text, no explanations.`,
};

@Injectable()
export class AiRewriteService {
	private openai: OpenAI | null = null;

	constructor(private readonly llmUsageService: LlmUsageService) {
		const apiKey = process.env.OPENAI_API_KEY;
		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
		}
	}

	parseFieldId(fieldId: string): ParsedFieldId | null {
		if (!fieldId || typeof fieldId !== "string" || !fieldId.trim()) {
			return null;
		}
		const trimmed = fieldId.trim();

		if (trimmed.startsWith(SETTINGS_PREFIX)) {
			const rest = trimmed.slice(SETTINGS_PREFIX.length);
			if (!rest) return null;
			return {
				section: "settings",
				entityIndex: null,
				fieldName: rest,
			};
		}

		if (!trimmed.startsWith(CONTENT_PREFIX)) {
			return null;
		}
		const afterContent = trimmed.slice(CONTENT_PREFIX.length);
		const parts = afterContent.split(".");

		if (parts.length === 2) {
			const [section, fieldName] = parts;
			if (STATIC_SECTIONS.includes(section as (typeof STATIC_SECTIONS)[number]) && fieldName) {
				return {
					section: section as (typeof STATIC_SECTIONS)[number],
					entityIndex: null,
					fieldName,
				};
			}
			return null;
		}

		if (parts.length >= 3) {
			const [section, indexStr, ...rest] = parts;
			if (ARRAY_SECTIONS.includes(section as (typeof ARRAY_SECTIONS)[number])) {
				const entityIndex = parseInt(indexStr, 10);
				if (!Number.isNaN(entityIndex) && entityIndex >= 0 && rest.length > 0) {
					const fieldName = rest.join(".");
					return {
						section: section as (typeof ARRAY_SECTIONS)[number],
						entityIndex,
						fieldName,
					};
				}
			}
		}

		return null;
	}

	getRewriteSystemPrompt(section: SectionKind, fieldName: string): string | null {
		if (section === "settings" || section === "unknown") {
			return null;
		}
		const key = `${section}.${fieldName}`;
		return REWRITE_PROMPTS[key] ?? null;
	}

	async rewrite(currentValue: string, sectionKind: string, fieldKey: string): Promise<string> {
		if (!this.openai) {
			throw new ServiceUnavailableException("AI rewrite not configured");
		}

		const kind = sectionKind.trim().toLowerCase();
		const key = fieldKey.trim();
		if (!kind || !key) {
			throw new BadRequestException("sectionKind and fieldKey are required");
		}

		const systemPrompt = this.getRewriteSystemPrompt(kind as SectionKind, key);
		if (!systemPrompt) {
			throw new BadRequestException("Rewrite not supported for this field");
		}

		const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
		const startMs = Date.now();
		let response: Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>;
		try {
			response = await this.openai.chat.completions.create({
				model,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: currentValue },
				],
			});
		} catch (openaiErr) {
			throw openaiErr;
		}

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
