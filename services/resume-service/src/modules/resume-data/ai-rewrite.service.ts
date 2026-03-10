import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";

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

	constructor() {
		const apiKey = process.env.OPENAI_API_KEY;
		console.log("asd", apiKey);
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
		// #region agent log
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
			body: JSON.stringify({
				sessionId: "c6e154",
				location: "ai-rewrite.service.ts:rewrite",
				message: "rewrite entered",
				data: { openaiIsNull: !this.openai, sectionKind, fieldKey },
				timestamp: Date.now(),
				hypothesisId: "H1",
			}),
		}).catch(() => {});
		// #endregion
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

		let response: Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>;
		try {
			response = await this.openai.chat.completions.create({
				model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: currentValue },
				],
			});
		} catch (openaiErr) {
			// #region agent log
			fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
				body: JSON.stringify({
					sessionId: "c6e154",
					location: "ai-rewrite.service.ts:rewrite",
					message: "OpenAI create failed",
					data: { errMessage: openaiErr instanceof Error ? openaiErr.message : String(openaiErr) },
					timestamp: Date.now(),
					hypothesisId: "H3",
				}),
			}).catch(() => {});
			// #endregion
			throw openaiErr;
		}

		// #region agent log
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
			body: JSON.stringify({
				sessionId: "c6e154",
				location: "ai-rewrite.service.ts:rewrite",
				message: "OpenAI create success",
				data: { hasContent: !!response.choices?.[0]?.message?.content },
				timestamp: Date.now(),
				hypothesisId: "H3",
			}),
		}).catch(() => {});
		// #endregion

		const content = response.choices[0]?.message?.content;
		if (content == null) {
			return "";
		}
		return content.trim();
	}
}
