import { DocumentBuiltInSection, type DocumentDetail, type DocumentSection, type DocumentSource } from "@algo/cv-core";
import type { StateCreator } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved";

export interface DocumentSlice {
	documentId: string;
	documentSource: DocumentSource | null;
	title: string;
	sections: DocumentSection[];
	fields: Record<string, string>;
	saveStatus: SaveStatus;

	setDocument: (document: DocumentDetail) => void;
	setFieldValue: (field: string, value: string) => void;
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
