import type { CVDocument } from "@/core/document";

export interface CVPreviewSelection {
	sectionId: string;
	entryIndex?: number; // for repeatable sections
	fieldId?: string; // for field-level selection
}

export interface CVPreviewProps {
	document: CVDocument;
	selected?: CVPreviewSelection | null;
	onSectionClick: (selection: CVPreviewSelection) => void;
}
