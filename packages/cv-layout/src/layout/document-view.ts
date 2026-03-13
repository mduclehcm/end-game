import type { DocumentData, Section } from "@algo/cv-core";

function getOrderedEntities(section: Section): Section["entities"] {
	const byId = new Map(section.entities.map((e) => [e.id, e]));
	return section.entityIds.map((id) => byId.get(id)).filter((e): e is NonNullable<typeof e> => e != null);
}

/**
 * Build path for a field in the document view (for layout bind/repeat).
 */
export function fieldPath(section: Section, entityIndex: number, fieldKey: string): string {
	const kind = section.kind;
	if (kind === "settings") return `settings.${fieldKey}`;
	if (section.entityIds.length <= 1) return `content.${kind}.${fieldKey}`;
	return `content.${kind}.${entityIndex}.${fieldKey}`;
}

/**
 * Build a flat Record<string, string> view of the document for layout binding.
 */
export function getDocumentView(data: DocumentData): Record<string, string> {
	const view: Record<string, string> = {};

	function isNonEmpty(value: string | undefined): value is string {
		return value !== undefined && value !== null && String(value).trim() !== "";
	}

	const sectionsById = new Map(data.sections.map((s) => [s.id, s]));
	const sectionOrder = data.sectionIds;

	for (const sectionId of sectionOrder) {
		const section = sectionsById.get(sectionId);
		if (!section) continue;

		const ordered = getOrderedEntities(section);
		ordered.forEach((entity, entityIndex) => {
			for (const field of entity.fields) {
				const path = fieldPath(section, entityIndex, field.key ?? field.id);
				const value = data.fieldValues[field.id];
				if (isNonEmpty(value)) view[path] = value;
			}
		});
	}

	for (const sectionId of sectionOrder) {
		const section = sectionsById.get(sectionId);
		if (!section || section.entityIds.length <= 1) continue;
		const source = `content.${section.kind}`;
		const indices = getRepeatIndices(view, source);
		if (indices.length > 0) {
			view[`${source}._hasItems`] = "true";
		}
	}

	if (Object.keys(view).length === 0 && Object.keys(data.fieldValues).length > 0) {
		return { ...data.fieldValues };
	}

	return view;
}

/**
 * Infer repeat array indices from document keys.
 */
export function getRepeatIndices(document: Record<string, string>, source: string): number[] {
	const prefix = source.endsWith(".") ? source : `${source}.`;
	const re = new RegExp(`^${escapeRegex(prefix)}(\\d+)\\.`);
	const indices = new Set<number>();
	for (const key of Object.keys(document)) {
		const m = key.match(re);
		if (m) indices.add(parseInt(m[1], 10));
	}
	return [...indices].sort((a, b) => a - b);
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
