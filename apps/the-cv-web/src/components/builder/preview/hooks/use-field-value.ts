import { useBuilderStore } from "@/store/builder-store";
import type { DataFieldRef } from "../types";

/**
 * Get live value from store for a data field.
 * Subscribes to store updates and re-renders when the field value changes.
 * Uses fieldId as the unique binding key (same as in fieldValues).
 */
export function useFieldValue(dataField: DataFieldRef | undefined): unknown {
	return useBuilderStore((state) => {
		if (!dataField?.fieldId) return undefined;
		return state.data.fieldValues[dataField.fieldId];
	});
}
