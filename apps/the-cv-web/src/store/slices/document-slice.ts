import { DocumentBuiltInSection, type DocumentDetail, type DocumentSection, type DocumentSource } from "@algo/cv-core";
import type { StateCreator } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved";

const EXPERIENCE_KEYS = ["position", "company", "startDate", "endDate", "location", "description"] as const;
const EDUCATION_KEYS = ["institution", "degree", "startDate", "endDate", "city", "description"] as const;

export function getArrayIndices(fields: Record<string, string>, section: "experience" | "education"): number[] {
	const re = new RegExp(`^(?:content\\.)?${section}\\.(\\d+)\\.`);
	const indices = new Set<number>();
	for (const key of Object.keys(fields)) {
		const m = key.match(re);
		if (m) indices.add(parseInt(m[1], 10));
	}
	const sorted = [...indices].sort((a, b) => a - b);
	return sorted.length > 0 ? sorted : [0];
}

export interface DocumentSlice {
	documentId: string;
	documentSource: DocumentSource | null;
	title: string;
	sections: DocumentSection[];
	fields: Record<string, string>;
	saveStatus: SaveStatus;

	setDocument: (document: DocumentDetail) => void;
	setFieldValue: (field: string, value: string) => void;
	addArrayItem: (section: "experience" | "education") => void;
	removeArrayItem: (section: "experience" | "education", index: number) => void;
	reorderSections: (activeId: string, overId: string) => void;
	setSaveStatus: (status: SaveStatus) => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice> = (set) => ({
	documentId: "",
	documentSource: null,
	title: "",
	sections: [],
	fields: {},
	saveStatus: "idle",

	setDocument: (document) => {
		const sections = DocumentBuiltInSection.map((section) => ({
			kind: section,
			order: 2 + (Number(document.fields[`${section}.order`]) ?? 0),
			draggable: true,
		})).sort((a, b) => a.order - b.order);
		set(() => ({
			documentId: document.id,
			documentSource: document.source,
			title: document.title,
			sections,
			fields: document.fields,
			saveStatus: "idle",
		}));
	},
	setFieldValue: (field, value) => {
		set((state) => ({ fields: { ...state.fields, [field]: value } }));
	},
	addArrayItem: (section) => {
		set((state) => {
			const indices = getArrayIndices(state.fields, section);
			const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 0;
			const keys = section === "experience" ? EXPERIENCE_KEYS : EDUCATION_KEYS;
			const newFields = { ...state.fields };
			for (const key of keys) {
				newFields[`${section}.${nextIndex}.${key}`] = "";
			}
			return { fields: newFields };
		});
	},
	removeArrayItem: (section, index) => {
		set((state) => {
			const newFields: Record<string, string> = {};
			const re = new RegExp(`^(content\\.)?${section}\\.(\\d+)\\.(.+)$`);
			for (const [k, v] of Object.entries(state.fields)) {
				const match = k.match(re);
				if (!match) {
					newFields[k] = v;
					continue;
				}
				const prefix = match[1] ?? "";
				const keyIndex = parseInt(match[2], 10);
				const subKey = match[3];
				if (keyIndex === index) continue;
				if (keyIndex > index) {
					newFields[`${prefix}${section}.${keyIndex - 1}.${subKey}`] = v;
				} else {
					newFields[k] = v;
				}
			}
			return { fields: newFields };
		});
	},
	reorderSections: (activeId, overId) => {
		set((state) => {
			const oldIndex = state.sections.findIndex((s) => s.kind === activeId);
			const newIndex = state.sections.findIndex((s) => s.kind === overId);
			if (oldIndex === -1 || newIndex === -1) return state;
			const updated = [...state.sections];
			const [moved] = updated.splice(oldIndex, 1);
			updated.splice(newIndex, 0, moved);
			const reordered = updated.map((s, i) => ({ ...s, order: i }));
			const fields = { ...state.fields };
			for (const section of reordered) {
				fields[`${section.kind}.order`] = String(section.order);
			}
			return { sections: reordered, fields };
		});
	},
	setSaveStatus: (status) => set(() => ({ saveStatus: status })),
});
