import type { DocumentData, Entity, Section } from "@algo/cv-core";
import { nanoid } from "nanoid";
import { createFieldsFromTemplate, ENTITY_FIELD_TEMPLATES } from "@/data/entity-field-templates";
import { getDefaultDocument } from "./default-cv";

/** Section kinds: static (personal, summary), array (experience, education, skills, languages), settings. */
const SECTION_KINDS = ["personal", "summary", "experience", "education", "skills", "languages", "settings"] as const;

/** Kinds that appear in the sortable builder list. */
const SORTABLE_SECTION_KINDS = ["experience", "education", "skills", "settings"] as const;

function fieldPath(section: Section, entityIndex: number, fieldKey: string, multiEntity: boolean): string {
	const kind = section.kind;
	if (kind === "settings") return `settings.${fieldKey}`;
	if (!multiEntity) return `content.${kind}.${fieldKey}`;
	return `content.${kind}.${entityIndex}.${fieldKey}`;
}

function buildSectionsWithEntities(initialByPath: Record<string, string>): {
	sections: DocumentData["sections"];
	sectionIds: string[];
	fieldValues: Record<string, string>;
} {
	const sectionIds: string[] = [];
	const sections: DocumentData["sections"] = [];
	const fieldValues: Record<string, string> = {};

	for (const kind of SECTION_KINDS) {
		const template = ENTITY_FIELD_TEMPLATES[kind];
		if (!template) {
			const id = nanoid(10);
			sectionIds.push(id);
			sections.push({ id, kind, entityIds: [], entities: [] });
			continue;
		}

		const sectionId = nanoid(10);
		sectionIds.push(sectionId);

		// Number of entities: from initialByPath for array sections, else 1
		let entityCount = 1;
		if (["experience", "education", "skills", "languages"].includes(kind)) {
			const prefix = `content.${kind}.`;
			const indices = new Set<number>();
			for (const key of Object.keys(initialByPath)) {
				if (!key.startsWith(prefix)) continue;
				const rest = key.slice(prefix.length);
				const m = /^(\d+)\./.exec(rest);
				if (m) indices.add(parseInt(m[1], 10));
			}
			entityCount = indices.size > 0 ? Math.max(...indices) + 1 : 1;
		}

		const entities: Entity[] = [];
		const entityIds: string[] = [];
		const isArraySection = ["experience", "education", "skills", "languages"].includes(kind);
		const multiEntity = isArraySection && entityCount > 1;

		for (let ei = 0; ei < entityCount; ei++) {
			const entityId = nanoid(10);
			entityIds.push(entityId);
			const fields = createFieldsFromTemplate(template);
			const entity: Entity = { id: entityId, kind, fields };
			entities.push(entity);

			for (const field of entity.fields) {
				const path = fieldPath(
					{ id: sectionId, kind, entityIds, entities } as Section,
					ei,
					field.key ?? field.id,
					multiEntity,
				);
				fieldValues[field.id] = initialByPath[path] ?? "";
			}
		}

		sections.push({
			id: sectionId,
			kind,
			entityIds,
			entities,
		});
	}

	return { sectionIds, sections, fieldValues };
}

/**
 * Returns DocumentData with dynamic sections, entities, and fields.
 * fieldValues is a map from field id to value.
 * Use for "Create blank CV" with empty string values.
 */
export function getBlankDocumentData(): DocumentData {
	const initialByPath: Record<string, string> = {};
	// Ensure at least one entity per array section and settings
	initialByPath["settings.templateId"] = "default-simple";
	initialByPath["settings.pageSize"] = "A4";
	initialByPath["settings.pageMargins.top"] = "20";
	initialByPath["settings.pageMargins.right"] = "20";
	initialByPath["settings.pageMargins.bottom"] = "20";
	initialByPath["settings.pageMargins.left"] = "20";

	const { sectionIds, sections, fieldValues } = buildSectionsWithEntities(initialByPath);

	return {
		sectionIds,
		sections,
		fieldValues,
	};
}

/**
 * Returns full DocumentData for the example CV: same structure as blank but
 * fieldValues filled from getDefaultDocument() (path-based keys mapped to field ids via structure).
 */
export function getDefaultDocumentData(): DocumentData {
	const initialByPath = getDefaultDocument();
	const { sectionIds, sections, fieldValues } = buildSectionsWithEntities(initialByPath);
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
 * Derives sectionIds and sections from path-based fieldValues when loading legacy data.
 * Creates sections with empty entities; caller may later migrate to id-based fieldValues.
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

	const order = ["personal", "summary", "experience", "education", "skills", "languages", "settings"] as const;
	const orderedIds: string[] = [];
	const orderedSections: DocumentData["sections"] = [];
	for (const kind of order) {
		if (!kindsSeen.has(kind)) continue;
		const idx = sections.findIndex((s) => s.kind === kind);
		if (idx === -1) continue;
		orderedIds.push(sectionIds[idx]);
		orderedSections.push(sections[idx]);
	}
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
 * Normalizes document data: if sectionIds/sections are empty (e.g. new CV),
 * returns default blank structure. Server data always has section/entity data.
 */
export function normalizeDocumentData(data: DocumentData): DocumentData {
	const hasNoStructure = data.sectionIds.length === 0 && data.sections.length === 0;
	if (!hasNoStructure) return data;
	return getBlankDocumentData();
}

export { SORTABLE_SECTION_KINDS };
