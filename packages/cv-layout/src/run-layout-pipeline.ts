import type { DocumentData } from "@algo/cv-core";
import { getTemplate } from "./default-template.js";
import { buildBoxTree } from "./layout/build-box-tree.js";
import { getDocumentView } from "./layout/document-view.js";
import { expandLayoutTree } from "./layout/expand-layout.js";
import type { FragmentTree, PageSettings } from "./layout/fragment-tree.js";
import { A4_PAGE, getContentRect } from "./layout/fragment-tree.js";
import { measureBoxTree } from "./layout/measure.js";
import type { LayoutMeasureAdapter } from "./layout/measure-adapter.js";
import { paginate } from "./layout/paginate.js";

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
 */
export async function runLayoutPipeline(
	data: DocumentData,
	measureAdapter: LayoutMeasureAdapter,
	templateId?: string,
): Promise<FragmentTree | null> {
	const document = getDocumentView(data);
	const id = templateId ?? document["settings.templateId"] ?? "default-simple";

	const template = getTemplate(id);
	const expanded = expandLayoutTree(template.layout, document, template);
	if (!expanded) return null;

	const pageSettings = getPageSettingsFromDocument(document);
	const rect = getContentRect(pageSettings);

	const boxRoot = buildBoxTree(expanded, rect.contentWidth);
	if (!boxRoot) return null;

	await measureBoxTree(boxRoot, measureAdapter);
	return paginate(boxRoot, rect);
}
