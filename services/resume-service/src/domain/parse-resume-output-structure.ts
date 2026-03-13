import { ENTITY_FIELD_TEMPLATES } from "./entity-field-templates";
import { CONTENT_PREFIX, isArraySection, SETTINGS_PREFIX } from "./section-kinds";

/**
 * Backend-defined output structure for parse-resume. Injected into the system prompt
 * so the LLM returns the exact field paths we expect. Prompt config (role/guide) only
 * guides how to parse; this block defines what structure to return.
 */
export function getParseResumeOutputStructureText(): string {
	const lines: string[] = [
		"Output format: Respond with a single JSON object with exactly these keys:",
		'- "title": optional string (max 50 characters), document/resume title.',
		'- "fieldValues": object mapping field path keys to string values. Use only the path keys listed below (omit keys with no value).',
		"",
		"Allowed field path keys:",
	];

	// Static sections: content.personal.*, content.summary.*
	for (const kind of ["personal", "summary"] as const) {
		const template = ENTITY_FIELD_TEMPLATES[kind];
		if (!template) continue;
		const paths = template.map((f) => `${CONTENT_PREFIX}${kind}.${f.key}`).join(", ");
		lines.push(`- ${kind}: ${paths}`);
	}

	// Settings: settings.*
	const settingsTemplate = ENTITY_FIELD_TEMPLATES.settings;
	if (settingsTemplate) {
		const paths = settingsTemplate.map((f) => `${SETTINGS_PREFIX}${f.key}`).join(", ");
		lines.push(`- settings: ${paths}`);
	}

	// Array sections: content.<kind>.<index>.<fieldKey>
	const arrayKinds = ["experience", "education", "skills", "languages"] as const;
	for (const kind of arrayKinds) {
		if (!isArraySection(kind)) continue;
		const template = ENTITY_FIELD_TEMPLATES[kind];
		if (!template) continue;
		const fieldKeys = template.map((f) => f.key).join(", ");
		lines.push(`- ${kind} (repeatable, use 0-based index): content.${kind}.<index>.{${fieldKeys}}`);
	}

	return lines.join("\n");
}
