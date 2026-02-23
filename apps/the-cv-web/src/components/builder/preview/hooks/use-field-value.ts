import type { DataFieldRef } from "@/core/document/document-template";
import { useBuilderStore } from "@/store/builder-store";

/**
 * Get live value from store for a data field.
 * Subscribes to store updates and re-renders when the field value changes.
 */
export function useFieldValue(dataField: DataFieldRef | undefined): unknown {
	return useBuilderStore((state) => {
		if (!dataField) return undefined;
		const { sectionId, entryIndex, fieldId } = dataField;
		const section = state.content.snapshot.sections[sectionId];
		if (!section || !section.entries) return undefined;

		// All sections use entries array
		const entries = section.entries;
		const targetIndex = entryIndex ?? 0; // Default to first entry for single sections

		if (!Array.isArray(entries) || targetIndex >= entries.length) return undefined;

		return entries[targetIndex].fields[fieldId];
	});
}
