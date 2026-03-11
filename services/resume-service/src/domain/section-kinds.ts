/**
 * Re-export section kinds and rewrite support from shared cv-core.
 * Backend domain uses these for path building, parseFieldId, and rewrite policy.
 */
export {
	ARRAY_SECTIONS,
	CONTENT_PREFIX,
	isArraySection,
	isRewriteSupported,
	SECTION_KINDS,
	SECTION_KINDS_LIST,
	SETTINGS_PREFIX,
	type SectionKind,
	STATIC_SECTIONS,
} from "@algo/cv-core";
