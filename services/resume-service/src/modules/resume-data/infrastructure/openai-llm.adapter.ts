import type { SectionKind } from "@domain";
import { getParseResumeOutputStructureText, getRewriteSystemPrompt } from "@domain";
import { BadRequestException, Injectable } from "@nestjs/common";
import type { LlmClient, ParsedResumeResult } from "@ports";
import OpenAI from "openai";
import { LlmUsageService } from "../../ai-usage/llm-usage.service";
import { SystemPromptService } from "../../system-prompt/system-prompt.service";

const PARSE_RESUME_USE_CASE = "parse-resume";

@Injectable()
export class OpenAILlmAdapter implements LlmClient {
	private openai: OpenAI | null = null;

	constructor(
		private readonly llmUsageService: LlmUsageService,
		private readonly systemPromptService: SystemPromptService,
	) {
		const apiKey = process.env.OPENAI_API_KEY;
		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
		}
	}

	async extractResume(text: string): Promise<ParsedResumeResult | null> {
		if (!this.openai) return null;

		const useCaseKey = PARSE_RESUME_USE_CASE;
		const active = await this.systemPromptService.getActivePrompt(useCaseKey);
		if (!active) {
			throw new BadRequestException(
				`No system prompt configured for use case "${useCaseKey}". Create and activate one in System Prompts.`,
			);
		}
		// Prompt config (role + guide) guides how to parse; backend injects output structure so LLM returns correct field paths.
		const systemPrompt = [active.promptText, getParseResumeOutputStructureText()].filter(Boolean).join("\n\n");
		const promptId = active.id;
		const promptUseCaseKey = useCaseKey;

		const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
		const userContent = `Extract resume data from this text:\n\n${text.slice(0, 12000)}`;
		const startMs = Date.now();

		const response = await this.openai.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: systemPrompt },
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
				systemPrompt,
				userInput: userContent,
				output: content,
				inputTokens: response.usage?.prompt_tokens ?? 0,
				outputTokens: response.usage?.completion_tokens ?? 0,
				durationMs,
				promptId,
				promptUseCaseKey,
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
		if (!getRewriteSystemPrompt(kind as SectionKind, key)) {
			throw new BadRequestException("Rewrite not supported for this field");
		}

		const useCaseKey = `rewrite.${kind}.${key}`;
		const active = await this.systemPromptService.getActivePrompt(useCaseKey);
		if (!active) {
			throw new BadRequestException(
				`No system prompt configured for use case "${useCaseKey}". Create and activate one in System Prompts.`,
			);
		}
		const systemPrompt = active.promptText;
		const promptId = active.id;
		const promptUseCaseKey = useCaseKey;

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
				promptId,
				promptUseCaseKey,
			})
			.catch(() => {});

		return output;
	}
}
