import type { DocumentData, DocumentDetail, DocumentSource, Entity, Section } from "@algo/cv-core";
import { nanoid } from "nanoid";
import type { StateCreator } from "zustand";
import { normalizeDocumentData } from "@/data/default-document-data";
import { cloneEntityFields, createFieldsFromTemplate, ENTITY_FIELD_TEMPLATES } from "@/data/entity-field-templates";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * Returns entities for a section in display order (by entityIds).
 * Use this to iterate over section entities in the UI.
 */
export function getOrderedEntities(section: Section): Entity[] {
	const order = section.entityIds;
	if (order.length === 0) return [];
	const byId = new Map(section.entities.map((e) => [e.id, e]));
	return order.map((id) => byId.get(id)).filter((e): e is Entity => e != null);
}

export function findSection(data: DocumentData, sectionId: string): Section | undefined {
	return data.sections.find((s) => s.id === sectionId);
}

export interface DocumentSlice {
	documentId: string;
	documentSource: DocumentSource | null;
	title: string;
	data: DocumentData;

	saveStatus: SaveStatus;

	setDocument: (document: DocumentDetail) => void;
	/** Set value for a field by its id. fieldValues is a map from field id to value. */
	setFieldValue: (fieldId: string, value: string) => void;
	/** Add a new entity to a section (e.g. new experience or education entry). */
	addArrayItem: (sectionId: string, index?: number) => void;
	/** Remove entity at index from section and clear its field values. */
	removeArrayItem: (sectionId: string, index: number) => void;
	addEntityItem: (sectionId: string) => void;
	removeEntityItem: (entityId: string) => void;
	/** Duplicate an entity (e.g. experience or education entry) and insert it right after the original. */
	duplicateEntity: (entityId: string) => void;
	reorderSectionIds: (activeId: string, overId: string) => void;

	setSaveStatus: (status: SaveStatus) => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice> = (set) => ({
	documentId: "",
	documentSource: null,
	title: "",
	saveStatus: "idle",

	data: {
		sectionIds: [],
		sections: [],
		fieldValues: {},
	},

	setDocument: (document) => {
		const data = normalizeDocumentData(document.data);
		set(() => ({
			documentId: document.id,
			documentSource: document.source,
			title: document.title,
			data,
		}));
	},
	setFieldValue: (fieldId, value) => {
		set((state) => ({
			data: {
				...state.data,
				fieldValues: { ...state.data.fieldValues, [fieldId]: value },
			},
		}));
	},
	addArrayItem: (sectionId, atIndex) => {
		set((state) => {
			const section = findSection(state.data, sectionId);
			if (!section) return state;

			const template = ENTITY_FIELD_TEMPLATES[section.kind];
			const fields =
				section.entities.length > 0
					? cloneEntityFields(section.entities[0].fields)
					: template
						? createFieldsFromTemplate(template)
						: [];

			if (fields.length === 0) return state;

			const newEntity: Entity = {
				id: nanoid(10),
				kind: section.kind,
				fields,
			};

			const entityIds = [...section.entityIds];
			const entities = [...section.entities, newEntity];
			const insertAt = atIndex ?? entityIds.length;
			entityIds.splice(insertAt, 0, newEntity.id);

			const nextFieldValues = { ...state.data.fieldValues };
			for (const f of newEntity.fields) {
				nextFieldValues[f.id] = "";
			}

			const nextSections = state.data.sections.map((s) => (s.id === sectionId ? { ...s, entityIds, entities } : s));

			return {
				data: {
					...state.data,
					sections: nextSections,
					fieldValues: nextFieldValues,
				},
			};
		});
	},
	removeArrayItem: (sectionId, index) => {
		set((state) => {
			const section = findSection(state.data, sectionId);
			if (!section || index < 0 || index >= section.entityIds.length) return state;

			const entityId = section.entityIds[index];
			const entity = section.entities.find((e) => e.id === entityId);
			const fieldIdsToRemove = entity ? entity.fields.map((f) => f.id) : [];

			const entityIds = section.entityIds.filter((_, i) => i !== index);
			const entities = section.entities.filter((e) => e.id !== entityId);

			const nextFieldValues = { ...state.data.fieldValues };
			for (const id of fieldIdsToRemove) {
				delete nextFieldValues[id];
			}

			const nextSections = state.data.sections.map((s) => (s.id === sectionId ? { ...s, entityIds, entities } : s));

			return {
				data: {
					...state.data,
					sections: nextSections,
					fieldValues: nextFieldValues,
				},
			};
		});
	},
	addEntityItem: (sectionId) => {
		set((state) => {
			const id = nanoid(10);
			return {
				data: {
					...state.data,
					sections: [...state.data.sections, { id, kind: sectionId, entityIds: [], entities: [] }],
				},
			};
		});
	},
	removeEntityItem: (entityId) => {
		set((state) => {
			const next = state.data.sections.filter((s) => s.id !== entityId);
			return { data: { ...state.data, sections: next } };
		});
	},
	duplicateEntity: (entityId) => {
		set((state) => {
			const section = state.data.sections.find((s) => s.entityIds.includes(entityId));
			if (!section) return state;

			const entity = section.entities.find((e) => e.id === entityId);
			if (!entity) return state;

			const index = section.entityIds.indexOf(entityId);
			const clonedFields = cloneEntityFields(entity.fields);
			const newEntity: Entity = {
				id: nanoid(10),
				kind: entity.kind,
				fields: clonedFields,
			};

			const entityIds = [...section.entityIds];
			const entities = [...section.entities, newEntity];
			entityIds.splice(index + 1, 0, newEntity.id);

			const nextFieldValues = { ...state.data.fieldValues };
			for (let i = 0; i < entity.fields.length; i++) {
				const oldFieldId = entity.fields[i].id;
				const newFieldId = clonedFields[i].id;
				nextFieldValues[newFieldId] = state.data.fieldValues[oldFieldId] ?? "";
			}

			const nextSections = state.data.sections.map((s) => (s.id === section.id ? { ...s, entityIds, entities } : s));

			return {
				data: {
					...state.data,
					sections: nextSections,
					fieldValues: nextFieldValues,
				},
			};
		});
	},
	reorderSectionIds: (activeId, overId) => {
		set((state) => {
			const activeIndex = state.data.sectionIds.indexOf(activeId);
			const overIndex = state.data.sectionIds.indexOf(overId);
			if (activeIndex === -1 || overIndex === -1) return state;
			const nextIds = [...state.data.sectionIds];
			const [removed] = nextIds.splice(activeIndex, 1);
			nextIds.splice(overIndex, 0, removed);
			return { data: { ...state.data, sectionIds: nextIds } };
		});
	},
	setSaveStatus: (status) => set(() => ({ saveStatus: status })),
});
