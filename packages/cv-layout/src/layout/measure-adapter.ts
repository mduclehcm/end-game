import type { ResolvedStyleProps } from "../style-types.js";

/**
 * Adapter for measuring text and images so the layout pipeline can run in browser (DOM) or Node (e.g. JSDOM).
 * The web app provides a DOM-based implementation; the resume-service can provide a JSDOM-based one.
 */
export interface LayoutMeasureAdapter {
	/** Measure text block height and line count at the given width. */
	measureText(params: {
		content: string;
		width: number;
		style: ResolvedStyleProps;
		isHtml?: boolean;
	}): Promise<{ height: number; lineCount: number }>;

	/** Measure natural (unwrapped) width of text. Optional; if missing, width is estimated from content. */
	measureTextNaturalWidth?(params: { content: string; style: ResolvedStyleProps }): Promise<number>;

	/** Resolve image dimensions. Return { width: 0, height: 0 } on load error or empty src. */
	getImageSize(src: string): Promise<{ width: number; height: number }>;
}
