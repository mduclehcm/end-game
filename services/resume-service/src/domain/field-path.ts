import { CONTENT_PREFIX, SETTINGS_PREFIX } from "./section-kinds";

/**
 * Build path key for a field (used when converting path-based field values to document data).
 * - settings: settings.${fieldKey}
 * - static section: content.${kind}.${fieldKey}
 * - array section: content.${kind}.${entityIndex}.${fieldKey}
 */
export function fieldPath(
	kind: string,
	entityIndex: number,
	fieldKey: string,
	multiEntity: boolean,
): string {
	if (kind === "settings") return `${SETTINGS_PREFIX}${fieldKey}`;
	if (!multiEntity) return `${CONTENT_PREFIX}${kind}.${fieldKey}`;
	return `${CONTENT_PREFIX}${kind}.${entityIndex}.${fieldKey}`;
}
