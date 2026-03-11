import type { DocumentData, Entity } from "@algo/cv-core";
import { createFieldsFromTemplate, ENTITY_FIELD_TEMPLATES } from "./entity-field-templates";
import { fieldPath } from "./field-path";
import { CONTENT_PREFIX, isArraySection, SECTION_KINDS_LIST } from "./section-kinds";

/**
 * Converts path-based field values (from LLM parse) to full DocumentData with section/entity/field
 * structure and nanoid ids. fieldValues in the result are keyed by field id for DB storage.
 */
export async function convertPathFieldValuesToDocumentData(
	initialByPath: Record<string, string>,
): Promise<DocumentData> {
	const { nanoid } = await import("nanoid");
	const sectionIds: string[] = [];
	const sections: DocumentData["sections"] = [];
	const fieldValues: Record<string, string> = {};

	for (const kind of SECTION_KINDS_LIST) {
		const template = ENTITY_FIELD_TEMPLATES[kind];
		if (!template) {
			const id = nanoid(10);
			sectionIds.push(id);
			sections.push({ id, kind, entityIds: [], entities: [] });
			continue;
		}

		const sectionId = nanoid(10);
		sectionIds.push(sectionId);

		let entityCount = 1;
		if (isArraySection(kind)) {
			const prefix = `${CONTENT_PREFIX}${kind}.`;
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
		const multiEntity = isArraySection(kind);

		for (let ei = 0; ei < entityCount; ei++) {
			const entityId = nanoid(10);
			entityIds.push(entityId);
			const fields = await createFieldsFromTemplate(template);
			const entity: Entity = { id: entityId, kind, fields };
			entities.push(entity);

			for (const field of entity.fields) {
				const path = fieldPath(kind, ei, field.key ?? field.id, multiEntity);
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

	return {
		sectionIds,
		sections,
		fieldValues,
	};
}
