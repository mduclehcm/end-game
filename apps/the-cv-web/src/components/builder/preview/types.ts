import type { CVDocument } from "@/core/document";

export interface CVPreviewSelection {
	sectionId: string;
	entryIndex?: number; // for repeatable sections
	fieldId?: string; // for field-level selection
}

/** Reference for binding: fieldId is the unique key in fieldValues (e.g. "education.0.institution" or "content.personal.firstName"). */
export interface DataFieldRef {
	fieldId: string;
}

export interface CVPreviewProps {
	document: CVDocument;
	selected?: CVPreviewSelection | null;
	onSectionClick: (selection: CVPreviewSelection) => void;
}
