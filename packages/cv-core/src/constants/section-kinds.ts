/**
 * Section kinds shared between backend and frontend.
 * Used for document structure, path keys, and rewrite support.
 */

export const CONTENT_PREFIX = "content.";
export const SETTINGS_PREFIX = "settings.";

export const STATIC_SECTIONS = ["personal", "summary"] as const;
export const ARRAY_SECTIONS = ["experience", "education", "skills", "languages"] as const;
export const SECTION_KINDS = [
	...STATIC_SECTIONS,
	...ARRAY_SECTIONS,
	"settings",
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

export const SECTION_KINDS_LIST: readonly string[] = [
	"personal",
	"summary",
	"experience",
	"education",
	"skills",
	"languages",
	"settings",
];

export function isArraySection(kind: string): boolean {
	return (ARRAY_SECTIONS as readonly string[]).includes(kind);
}

/**
 * [sectionKind, fieldKey] pairs that support AI rewrite.
 * Frontend can use this to show/hide the rewrite button; backend uses it for validation.
 */
export const REWRITE_SUPPORTED_FIELDS: ReadonlyArray<[string, string]> = [
	["summary", "text"],
	["experience", "description"],
	["education", "description"],
];

export function isRewriteSupported(sectionKind: string, fieldKey: string): boolean {
	const k = sectionKind.trim().toLowerCase();
	const f = fieldKey.trim();
	return REWRITE_SUPPORTED_FIELDS.some(([s, x]) => s === k && x === f);
}
