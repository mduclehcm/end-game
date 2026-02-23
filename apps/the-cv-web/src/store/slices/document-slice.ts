import type { StateCreator } from "zustand";
import type { UserDocument } from "@/core/document";
import { Logger } from "@/lib/logger";

const logger = new Logger("document-store");

export interface DocumentSlice {
	document: UserDocument | null;
	fields: Record<string, string>;
	setDocument: (document: UserDocument) => void;
	setFieldValue: (field: string, value: string) => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice> = (set) => ({
	document: null,
	fields: {},
	setDocument: (document) => {
		logger.info(`setting document to ${document.id}`);
		set(() => ({ document, fields: document.fields }));
	},
	setFieldValue: (field, value) => {
		set((state) => ({ fields: { ...state.fields, [field]: value } }));
	},
});
