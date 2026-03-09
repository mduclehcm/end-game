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
import { getDefaultDocument } from "@/data/default-cv";
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
 */
export async function runLayoutPipeline(data: DocumentData, templateId?: string): Promise<FragmentTree | null> {
	const base = getDocumentView(data);
	let document: Record<string, string> = { ...getDefaultDocument(), ...base };
	const id = templateId ?? document["settings.templateId"] ?? "default-simple";
	let template: DocumentTemplate;
	try {
		template = getTemplate(id);
	} catch {
		template = getTemplate("default-simple");
	}
	let expanded = expandLayoutTree(template.layout, document, template);
	// If expansion is empty (e.g. no field values or conditionals hiding everything), show default content
	if (!expanded) {
		document = getDefaultDocument();
		expanded = expandLayoutTree(template.layout, document, template);
	}
	if (!expanded) return null;

	const pageSettings = getPageSettingsFromDocument(document);
	const rect = getContentRect(pageSettings);
	const boxRoot = buildBoxTree(expanded, rect.contentWidth);
	if (!boxRoot) return null;

	await measureBoxTree(boxRoot);
	return paginate(boxRoot, rect);
}
