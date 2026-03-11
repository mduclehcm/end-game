/**
 * Re-export section kinds and rewrite support from shared cv-core.
 * Backend domain uses these for path building, parseFieldId, and rewrite policy.
 */
export {
	ARRAY_SECTIONS,
	CONTENT_PREFIX,
	SECTION_KINDS,
	SECTION_KINDS_LIST,
	SETTINGS_PREFIX,
	STATIC_SECTIONS,
	isArraySection,
	isRewriteSupported,
	type SectionKind,
} from "@algo/cv-core";
