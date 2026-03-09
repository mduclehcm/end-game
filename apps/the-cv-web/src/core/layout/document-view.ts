import type { DocumentData } from "@algo/cv-core";

/**
 * Build a flat Record<string, string> view of the document for layout binding.
 * Uses fieldValues as-is so keys like "content.personal.firstName" and
 * "content.experience.0.position" work for bind() and repeat array discovery.
 */
export function getDocumentView(data: DocumentData): Record<string, string> {
	return { ...data.fieldValues };
}

/**
 * Infer repeat array indices from document keys.
 * e.g. source "content.experience" -> keys "content.experience.0.*", "content.experience.1.*"
 * Returns sorted array of indices that appear in the document.
 */
export function getRepeatIndices(document: Record<string, string>, source: string): number[] {
	const prefix = source.endsWith(".") ? source : `${source}.`;
	const re = new RegExp(`^${escapeRegex(prefix)}(\\d+)\\.`);
	const indices = new Set<number>();
	for (const key of Object.keys(document)) {
		const m = key.match(re);
		if (m) indices.add(parseInt(m[1], 10));
	}
	return [...indices].sort((a, b) => a - b);
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
