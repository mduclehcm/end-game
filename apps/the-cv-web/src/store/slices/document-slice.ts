import type { DocumentData, DocumentDetail, DocumentSource } from "@algo/cv-core";
import { nanoid } from "nanoid";
import type { StateCreator } from "zustand";
import { normalizeDocumentData } from "@/data/default-document-data";

export type SaveStatus = "idle" | "saving" | "saved";

/** Section kind used for array-based form fields (experience, education). */
export type ArraySectionKind = "experience" | "education";

/** Defines each section kind and its entity field names. Single source of truth for add/remove/indices. */
export const ENTITY_ARRAY_SECTIONS: Record<ArraySectionKind, readonly string[]> = {
	experience: ["position", "company", "startDate", "endDate", "location", "description"],
	education: ["institution", "degree", "startDate", "endDate", "city", "description"],
};

function getSectionKind(sections: DocumentData["sections"], sectionId: string): ArraySectionKind | null {
	const section = sections.find((s) => s.id === sectionId);
	if (!section || !(section.kind in ENTITY_ARRAY_SECTIONS)) return null;
	return section.kind as ArraySectionKind;
}

function parseSectionKey(
	kind: ArraySectionKind,
	key: string,
): { index: number; field: string; keyPrefix: string } | null {
	// Support both "experience.0.field" and "content.experience.0.field"
	const prefixWithContent = `content.${kind}.`;
	const prefixPlain = `${kind}.`;
	const keyPrefix = key.startsWith(prefixWithContent)
		? prefixWithContent.slice(0, -1) // "content.experience"
		: key.startsWith(prefixPlain)
			? kind
			: null;
	if (keyPrefix === null) return null;
	const prefix = keyPrefix + ".";
	if (!key.startsWith(prefix)) return null;
	const rest = key.slice(prefix.length);
	const dot = rest.indexOf(".");
	if (dot === -1) return null;
	const indexStr = rest.slice(0, dot);
	const field = rest.slice(dot + 1);
	const index = parseInt(indexStr, 10);
	if (Number.isNaN(index) || !ENTITY_ARRAY_SECTIONS[kind].includes(field)) return null;
	return { index, field, keyPrefix };
}

export function getArrayIndices(
	fields: Record<string, string>,
	sectionIdOrKind: string,
	sections?: DocumentData["sections"],
): number[] {
	const kind: ArraySectionKind | null =
		sections != null
			? getSectionKind(sections, sectionIdOrKind)
			: sectionIdOrKind in ENTITY_ARRAY_SECTIONS
				? (sectionIdOrKind as ArraySectionKind)
				: null;
	if (!kind) return [0];
	const indices = new Set<number>();
	for (const key of Object.keys(fields)) {
		const parsed = parseSectionKey(kind, key);
		if (parsed) indices.add(parsed.index);
	}
	const sorted = [...indices].sort((a, b) => a - b);
	return sorted.length > 0 ? sorted : [0];
}

export interface DocumentSlice {
	documentId: string;
	documentSource: DocumentSource | null;
	title: string;
	data: DocumentData;

	saveStatus: SaveStatus;

	setDocument: (document: DocumentDetail) => void;
	setFieldValue: (fieldId: string, value: string) => void;
	addArrayItem: (sectionId: string, index?: number) => void;
	removeArrayItem: (sectionId: string, index: number) => void;
	addEntityItem: (sectionId: string) => void;
	removeEntityItem: (entityId: string) => void;
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
	setFieldValue: (field, value) => {
		set((state) => ({ data: { ...state.data, fieldValues: { ...state.data.fieldValues, [field]: value } } }));
	},
	addArrayItem: (sectionId, atIndex) => {
		set((state) => {
			const kind = getSectionKind(state.data.sections, sectionId);
			if (!kind) return state;
			const fieldNames = ENTITY_ARRAY_SECTIONS[kind];
			const indices = getArrayIndices(state.data.fieldValues, sectionId, state.data.sections);
			const nextIndex = atIndex ?? (indices.length > 0 ? Math.max(...indices) + 1 : 0);
			// Use content.* prefix so keys match stored resume data (content.experience.0.position etc.)
			const keyPrefix = kind === "experience" || kind === "education" ? `content.${kind}` : kind;
			const next: Record<string, string> = { ...state.data.fieldValues };
			for (const name of fieldNames) {
				next[`${keyPrefix}.${nextIndex}.${name}`] = "";
			}
			return { data: { ...state.data, fieldValues: next } };
		});
	},
	removeArrayItem: (sectionId, index) => {
		set((state) => {
			const kind = getSectionKind(state.data.sections, sectionId);
			if (!kind) return state;
			const fieldNames = ENTITY_ARRAY_SECTIONS[kind];
			const indices = getArrayIndices(state.data.fieldValues, sectionId, state.data.sections);
			const keyPrefixes: string[] = [kind, `content.${kind}`];
			const next = { ...state.data.fieldValues };
			for (const keyPrefix of keyPrefixes) {
				for (const idx of indices) {
					for (const field of fieldNames) {
						const key = `${keyPrefix}.${idx}.${field}`;
						if (!(key in next)) continue;
						const value = next[key];
						delete next[key];
						if (idx === index) continue;
						if (idx > index) next[`${keyPrefix}.${idx - 1}.${field}`] = value;
					}
				}
			}
			return { data: { ...state.data, fieldValues: next } };
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
	reorderSectionIds: (activeId, overId) => {
		set((state) => {
			const activeIndex = state.data.sectionIds.indexOf(activeId);
			const overIndex = state.data.sectionIds.indexOf(overId);
			if (activeIndex === -1 || overIndex === -1) return state;
			const [removed] = state.data.sectionIds.splice(activeIndex, 1);
			state.data.sectionIds.splice(overIndex, 0, removed);
			return { data: { ...state.data, sectionIds: state.data.sectionIds } };
		});
	},
	setSaveStatus: (status) => set(() => ({ saveStatus: status })),
});
