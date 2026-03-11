import { ARRAY_SECTIONS, CONTENT_PREFIX, SETTINGS_PREFIX, type SectionKind, STATIC_SECTIONS } from "./section-kinds";

export interface ParsedFieldId {
	section: SectionKind | "unknown";
	entityIndex: number | null;
	fieldName: string;
}

const REWRITE_PROMPTS: Record<string, string> = {
	"summary.text": `You are a professional resume editor. Rewrite the following professional summary to be more concise, impactful, and ATS-friendly. Keep the same tone and key points. Output only the rewritten text, no explanations.`,
	"experience.description": `You are a professional resume editor. Rewrite the following job description bullets to use strong action verbs, quantify achievements where possible, and keep the same structure (bullets or paragraphs). Output only the rewritten text, no explanations.`,
	"education.description": `You are a professional resume editor. Rewrite the following education description to use clear, professional language and keep the same structure. Output only the rewritten text, no explanations.`,
};

export function getRewriteSystemPrompt(section: SectionKind | "unknown", fieldName: string): string | null {
	if (section === "settings" || section === "unknown") {
		return null;
	}
	const key = `${section}.${fieldName}`;
	return REWRITE_PROMPTS[key] ?? null;
}

export function parseFieldId(fieldId: string): ParsedFieldId | null {
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

/** Rewrite request tied to domain: section kind + field key (for prompt selection). */
export interface RewriteFieldRequest {
	sectionKind: SectionKind | "unknown";
	fieldKey: string;
}
