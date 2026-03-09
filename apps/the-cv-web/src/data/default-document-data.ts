import type { DocumentData } from "@algo/cv-core";
import { nanoid } from "nanoid";
import { getDefaultDocument } from "./default-cv";

/** Sortable section kinds used in DataEditor (experience, education, skills, settings). */
const SORTABLE_SECTION_KINDS = ["experience", "education", "skills", "settings"] as const;

/**
 * Returns DocumentData with the same section structure as the example CV
 * but all section/content field values set to empty string.
 * Use for "Create blank CV" so the builder shows all sections with empty data.
 */
export function getBlankDocumentData(): DocumentData {
	const sectionIds: string[] = [];
	const sections: DocumentData["sections"] = [];

	for (const kind of SORTABLE_SECTION_KINDS) {
		const id = nanoid(10);
		sectionIds.push(id);
		sections.push({
			id,
			kind,
			entityIds: [],
			entities: [],
		});
	}

	// Same keys as default document but all content empty; keep settings so layout works.
	// All keys use prefixes: content.* for content, settings.* for settings.
	const fieldValues: Record<string, string> = {
		"content.personal.firstName": "",
		"content.personal.lastName": "",
		"content.personal.title": "",
		"content.personal.email": "",
		"content.personal.phone": "",
		"content.personal.location": "",
		"content.personal.postalCode": "",
		"content.personal.country": "",
		"content.personal.linkedin": "",
		"content.personal.address": "",
		"content.personal.nationality": "",
		"content.personal.placeOfBirth": "",
		"content.personal.drivingLicense": "",
		"content.personal.dateOfBirth": "",
		"content.summary.text": "",
		"content.experience.0.position": "",
		"content.experience.0.company": "",
		"content.experience.0.startDate": "",
		"content.experience.0.endDate": "",
		"content.experience.0.location": "",
		"content.experience.0.description": "",
		"content.education.0.institution": "",
		"content.education.0.degree": "",
		"content.education.0.startDate": "",
		"content.education.0.endDate": "",
		"content.education.0.city": "",
		"content.education.0.description": "",
		"content.skills.0.skill": "",
		"content.languages.0.language": "",
		"settings.templateId": "default-simple",
		"settings.pageSize": "A4",
		"settings.pageMargins.top": "20",
		"settings.pageMargins.right": "20",
		"settings.pageMargins.bottom": "20",
		"settings.pageMargins.left": "20",
	};

	return {
		sectionIds,
		sections,
		fieldValues,
	};
}

/**
 * Returns full DocumentData for the example CV: default fieldValues plus
 * sectionIds/sections so the builder shows all sortable sections.
 */
export function getDefaultDocumentData(): DocumentData {
	const fieldValues = getDefaultDocument();
	const sectionIds: string[] = [];
	const sections: DocumentData["sections"] = [];

	for (const kind of SORTABLE_SECTION_KINDS) {
		const id = nanoid(10);
		sectionIds.push(id);
		sections.push({
			id,
			kind,
			entityIds: [],
			entities: [],
		});
	}

	return {
		sectionIds,
		sections,
		fieldValues,
	};
}

/** Regex to detect array section keys: content.experience.0.field or content.skills.1.skill */
const ARRAY_SECTION_KEY = /^content\.(experience|education|skills|languages)\.(\d+)\./;
const SETTINGS_KEY_PREFIX = "settings.";

/**
 * Derives sectionIds and sections from fieldValues when they are missing.
 * Used when loading a document that only has fieldValues (e.g. from PDF import or example CV).
 */
export function buildDocumentDataFromFieldValues(fieldValues: Record<string, string>): DocumentData {
	const sectionIds: string[] = [];
	const sections: DocumentData["sections"] = [];
	const kindsSeen = new Set<string>();

	for (const key of Object.keys(fieldValues)) {
		const m = key.match(ARRAY_SECTION_KEY);
		if (m) {
			const kind = m[1];
			if (kindsSeen.has(kind)) continue;
			kindsSeen.add(kind);
			const id = nanoid(10);
			sectionIds.push(id);
			sections.push({
				id,
				kind,
				entityIds: [],
				entities: [],
			});
			continue;
		}
		if (key.startsWith(SETTINGS_KEY_PREFIX) && !kindsSeen.has("settings")) {
			kindsSeen.add("settings");
			const id = nanoid(10);
			sectionIds.push(id);
			sections.push({
				id,
				kind: "settings",
				entityIds: [],
				entities: [],
			});
		}
	}

	// Ensure stable order: experience, education, skills, languages, settings (match DataEditor order)
	const order = ["experience", "education", "skills", "languages", "settings"] as const;
	const orderedIds: string[] = [];
	const orderedSections: DocumentData["sections"] = [];
	for (const kind of order) {
		if (!kindsSeen.has(kind)) continue;
		const idx = sections.findIndex((s) => s.kind === kind);
		if (idx === -1) continue;
		orderedIds.push(sectionIds[idx]);
		orderedSections.push(sections[idx]);
	}
	// Add any kind not in order (e.g. settings) at the end
	for (let i = 0; i < sectionIds.length; i++) {
		if (orderedIds.includes(sectionIds[i])) continue;
		orderedIds.push(sectionIds[i]);
		orderedSections.push(sections[i]);
	}

	return {
		sectionIds: orderedIds.length > 0 ? orderedIds : sectionIds,
		sections: orderedSections.length > 0 ? orderedSections : sections,
		fieldValues,
	};
}

/**
 * Normalizes document data: if sectionIds/sections are empty but fieldValues exist,
 * derives sectionIds/sections from fieldValues so the builder renders correctly.
 */
export function normalizeDocumentData(data: DocumentData): DocumentData {
	const hasFieldValues = Object.keys(data.fieldValues).length > 0;
	const needsDerivation = data.sectionIds.length === 0 && data.sections.length === 0 && hasFieldValues;
	if (!needsDerivation) return data;
	return buildDocumentDataFromFieldValues(data.fieldValues);
}
