import type { LayoutMeasureAdapter } from "@algo/cv-layout";
import { JSDOM } from "jsdom";

/**
 * Build CSS string from ResolvedStyleProps for a measurement container.
 */
function styleToCss(style: import("@algo/cv-layout").ResolvedStyleProps): string {
	const parts: string[] = [
		"position:absolute",
		"visibility:hidden",
		"left:-9999px",
		"top:0",
		"box-sizing:border-box",
		"overflow:hidden",
	];
	if (style.padding != null) {
		const p = style.padding;
		parts.push(`padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`);
	}
	if (style.fontSize != null) parts.push(`font-size:${style.fontSize}px`);
	if (style.fontWeight != null) parts.push(`font-weight:${style.fontWeight}`);
	if (style.fontFamily != null) parts.push(`font-family:${style.fontFamily}`);
	if (style.lineHeight != null)
		parts.push(`line-height:${typeof style.lineHeight === "number" ? style.lineHeight : style.lineHeight}`);
	if (style.color != null) parts.push(`color:${style.color}`);
	return parts.join(";");
}

/**
 * JSDOM-based measure adapter for running the layout pipeline in Node.
 */
export function createJsdomMeasureAdapter(): LayoutMeasureAdapter {
	const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
	const document = dom.window.document;
	const body = document.body;

	let measureEl: HTMLElement | null = null;

	function getMeasureEl(): HTMLElement {
		if (measureEl == null) {
			measureEl = document.createElement("div");
			body.appendChild(measureEl);
		}
		return measureEl as HTMLElement;
	}

	return {
		async measureText({ content, width, style, isHtml }) {
			const el = getMeasureEl();
			el.style.cssText = `${styleToCss(style)};width:${width}px`;
			if (isHtml) {
				el.innerHTML = content;
			} else {
				el.textContent = content;
			}
			const height = el.offsetHeight;
			const lineHeight = style.lineHeight ?? (style.fontSize ? style.fontSize * 1.2 : 16);
			const lineCount = Math.max(1, Math.ceil(height / lineHeight));
			return { height, lineCount };
		},
		async measureTextNaturalWidth({ content, style }) {
			const el = getMeasureEl();
			el.style.cssText = `${styleToCss(style)};white-space:nowrap`;
			el.innerHTML = content;
			return Math.ceil(el.offsetWidth);
		},
		async getImageSize(src: string): Promise<{ width: number; height: number }> {
			if (!src) return { width: 0, height: 0 };
			// JSDOM cannot load external images; return placeholder so layout doesn't break.
			if (src.startsWith("data:")) {
				try {
					const match = src.match(/data:([^;]+);base64,/);
					if (match) {
						const base64 = src.slice(match[0].length);
						const buf = Buffer.from(base64, "base64");
						// Minimal dimension guess from buffer size to avoid adding image-size dep
						const size = Math.sqrt(buf.length / 3) | 0;
						return { width: Math.min(size, 400), height: Math.min(size, 400) };
					}
				} catch {
					// ignore
				}
			}
			return { width: 0, height: 0 };
		},
	};
}
