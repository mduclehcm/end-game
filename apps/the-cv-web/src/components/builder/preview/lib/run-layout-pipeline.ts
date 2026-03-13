import type { DocumentData } from "@algo/cv-core";
import type { PageSettings } from "@algo/cv-layout";
import { getPageSettingsFromDocument, runLayoutPipeline as runLayoutPipelineFromPackage } from "@algo/cv-layout";
import { createDomMeasureAdapter } from "./dom-measure-adapter";

export { getPageSettingsFromDocument };
export type { PageSettings };

/**
 * Run the full layout pipeline using shared @algo/cv-layout and DOM measurement.
 * When measureRoot is provided, text is measured in that element's font context so preview widths match.
 */
export async function runLayoutPipeline(
	data: DocumentData,
	templateId?: string,
	measureRoot?: HTMLElement | null,
): Promise<import("@algo/cv-layout").FragmentTree | null> {
	const adapter = createDomMeasureAdapter(measureRoot);
	return runLayoutPipelineFromPackage(data, adapter, templateId);
}
