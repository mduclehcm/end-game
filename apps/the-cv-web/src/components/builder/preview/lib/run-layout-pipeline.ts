import type { DocumentData } from "@algo/cv-core";
import type { DocumentTemplate } from "@/core/document";
import {
	A4_PAGE,
	buildBoxTree,
	expandLayoutTree,
	type FragmentTree,
	getContentRect,
	getDocumentView,
	measureBoxTree,
	type PageSettings,
	paginate,
} from "@/core/layout";
import { getTemplate } from "@/data/default-template";

const DEFAULT_PAGE_SETTINGS: PageSettings = {
	pageSize: A4_PAGE,
	margins: { top: 20, right: 20, bottom: 20, left: 20 },
	dpi: 96,
};

export function getPageSettingsFromDocument(fieldValues: Record<string, string>): PageSettings {
	const top = Number(fieldValues["settings.pageMargins.top"]) || DEFAULT_PAGE_SETTINGS.margins.top;
	const right = Number(fieldValues["settings.pageMargins.right"]) || DEFAULT_PAGE_SETTINGS.margins.right;
	const bottom = Number(fieldValues["settings.pageMargins.bottom"]) || DEFAULT_PAGE_SETTINGS.margins.bottom;
	const left = Number(fieldValues["settings.pageMargins.left"]) || DEFAULT_PAGE_SETTINGS.margins.left;
	return {
		...DEFAULT_PAGE_SETTINGS,
		margins: { top, right, bottom, left },
	};
}

/**
 * Run the full layout pipeline: expand -> box tree -> measure -> paginate.
 * Returns fragment tree or null if no layout/template.
 * When expansion is empty (e.g. blank/weird data), falls back to default document so preview still shows content.
 * When measureRoot is provided, text is measured in that element's font context so preview widths match (avoids e.g. phone truncation).
 */
export async function runLayoutPipeline(
	data: DocumentData,
	templateId?: string,
	measureRoot?: HTMLElement | null,
): Promise<FragmentTree | null> {
	const document = getDocumentView(data);
	const id = templateId ?? document["settings.templateId"] ?? "default-simple";

	const template: DocumentTemplate = getTemplate(id);
	if (!template) return null;

	const expanded = expandLayoutTree(template.layout, document, template);
	if (!expanded) return null;

	const pageSettings = getPageSettingsFromDocument(document);
	const rect = getContentRect(pageSettings);

	const boxRoot = buildBoxTree(expanded, rect.contentWidth);
	if (!boxRoot) return null;

	await measureBoxTree(boxRoot, undefined, measureRoot);
	return paginate(boxRoot, rect);
}
