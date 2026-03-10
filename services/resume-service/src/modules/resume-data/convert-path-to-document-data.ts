import type { DocumentData, Entity } from "@algo/cv-core";
import { createFieldsFromTemplate, ENTITY_FIELD_TEMPLATES } from "./entity-field-templates";

const SECTION_KINDS = ["personal", "summary", "experience", "education", "skills", "languages", "settings"] as const;

function fieldPath(kind: string, entityIndex: number, fieldKey: string, multiEntity: boolean): string {
	if (kind === "settings") return `settings.${fieldKey}`;
	if (!multiEntity) return `content.${kind}.${fieldKey}`;
	return `content.${kind}.${entityIndex}.${fieldKey}`;
}

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
