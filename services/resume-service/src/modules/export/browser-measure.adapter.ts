import type { Page } from "puppeteer";

/** Minimal style shape for measurement container; matches cv-layout ResolvedStyleProps. */
interface ResolvedStyleProps {
	padding?: { top: number; right: number; bottom: number; left: number };
	fontSize?: number;
	fontWeight?: number;
	fontFamily?: string;
	lineHeight?: number | string;
	fontStyle?: string;
	textTransform?: string;
	color?: string;
	backgroundColor?: string;
}

/** Adapter for measuring text/images in browser; matches cv-layout LayoutMeasureAdapter. */
interface LayoutMeasureAdapter {
	measureText(params: {
		content: string;
		width: number;
		style: ResolvedStyleProps;
		isHtml?: boolean;
	}): Promise<{ height: number; lineCount: number }>;
	measureTextNaturalWidth?(params: { content: string; style: ResolvedStyleProps }): Promise<number>;
	getImageSize(src: string): Promise<{ width: number; height: number }>;
}

/**
 * Build CSS string from ResolvedStyleProps for a measurement container.
 * Matches preview/fragment-tree styling so browser measurement aligns with final render.
 */
function styleToCss(style: ResolvedStyleProps): string {
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
	if (style.fontStyle != null) parts.push(`font-style:${style.fontStyle}`);
	if (style.textTransform != null) parts.push(`text-transform:${style.textTransform}`);
	if (style.color != null) parts.push(`color:${style.color}`);
	if (style.backgroundColor != null) parts.push(`background-color:${style.backgroundColor}`);
	return parts.join(";");
}

/**
 * Creates a measure adapter that runs in a Puppeteer page, so text/image
 * measurement uses the same browser DOM and fonts as the final PDF render.
 */
export function createBrowserMeasureAdapter(page: Page): LayoutMeasureAdapter {
	return {
		async measureText({ content, width, style, isHtml }) {
			const baseCss = styleToCss(style);
			const height = await page.evaluate(
				(params: { content: string; width: number; baseCss: string; isHtml: boolean }) => {
					const div = document.createElement("div");
					div.style.cssText = `${params.baseCss};width:${params.width}px`;
					if (params.isHtml) {
						div.innerHTML = params.content;
					} else {
						div.textContent = params.content;
					}
					document.body.appendChild(div);
					const h = div.offsetHeight;
					div.remove();
					return h;
				},
				{ content, width, baseCss, isHtml: isHtml ?? false },
			);
			const lineHeightRaw = style.lineHeight ?? (style.fontSize ? style.fontSize * 1.2 : 16);
			const lineHeight = typeof lineHeightRaw === "number" ? lineHeightRaw : Number(lineHeightRaw) || 16;
			const lineCount = Math.max(1, Math.ceil(height / lineHeight));
			return { height, lineCount };
		},
		async measureTextNaturalWidth({ content, style }) {
			const baseCss = styleToCss(style) + ";white-space:nowrap";
			return page.evaluate(
				(params: { content: string; baseCss: string }) => {
					const div = document.createElement("div");
					div.style.cssText = params.baseCss;
					div.innerHTML = params.content;
					document.body.appendChild(div);
					const w = Math.ceil(div.getBoundingClientRect().width);
					div.remove();
					return w;
				},
				{ content, baseCss },
			);
		},
		async getImageSize(src: string): Promise<{ width: number; height: number }> {
			if (!src) return { width: 0, height: 0 };
			return page.evaluate((url: string) => {
				return new Promise<{ width: number; height: number }>((resolve) => {
					const img = new Image();
					img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
					img.onerror = () => resolve({ width: 0, height: 0 });
					img.src = url;
				});
			}, src);
		},
	};
}

/**
 * Minimal HTML for the measurement page so fonts/CSS match the final PDF document.
 */
export const MEASURE_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body></body>
</html>`;
