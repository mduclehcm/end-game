import type { LayoutMeasureAdapter } from "@algo/cv-layout";
import { measureTextHeight, measureTextNaturalWidth } from "@/lib/dom-utils";

/**
 * Creates a measure adapter that uses the DOM (and optional measureRoot for font context).
 */
export function createDomMeasureAdapter(measureRoot?: HTMLElement | null): LayoutMeasureAdapter {
	return {
		async measureText({ content, width, style }) {
			const height = measureTextHeight(content, width, style, measureRoot);
			const lineHeight = style.lineHeight ?? (style.fontSize ? style.fontSize * 1.2 : 16);
			const lineCount = Math.max(1, Math.ceil(height / lineHeight));
			return { height, lineCount };
		},
		async measureTextNaturalWidth({ content, style }) {
			return measureTextNaturalWidth(content, style, measureRoot);
		},
		async getImageSize(src: string): Promise<{ width: number; height: number }> {
			if (!src) return { width: 0, height: 0 };
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => {
					resolve({ width: img.naturalWidth, height: img.naturalHeight });
				};
				img.onerror = () => resolve({ width: 0, height: 0 });
				img.src = src;
			});
		},
	};
}
