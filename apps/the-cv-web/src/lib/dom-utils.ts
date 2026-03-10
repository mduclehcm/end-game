import type { ResolvedStyleProps } from "../core/render/render-tree";
import { spaceBoxToCss } from "../core/render/render-tree";

function applyStylesToElement(el: HTMLElement, style: ResolvedStyleProps): void {
	// Layout properties
	if (style.padding != null) el.style.padding = spaceBoxToCss(style.padding);
	if (style.margin != null) el.style.margin = spaceBoxToCss(style.margin);
	if (style.width != null) {
		el.style.width = typeof style.width === "number" ? `${style.width}px` : style.width;
	}
	if (style.height != null) {
		el.style.height = typeof style.height === "number" ? `${style.height}px` : style.height;
	}

	// Typography
	if (style.fontSize != null) el.style.fontSize = `${style.fontSize}px`;
	if (style.fontWeight != null) el.style.fontWeight = String(style.fontWeight);
	if (style.fontFamily != null) el.style.fontFamily = String(style.fontFamily);
	if (style.lineHeight != null) el.style.lineHeight = String(style.lineHeight);
	if (style.fontStyle != null) el.style.fontStyle = style.fontStyle;

	// Colors (affects rendering)
	if (style.color != null) el.style.color = style.color;
	if (style.backgroundColor != null) el.style.backgroundColor = style.backgroundColor;
}

/** Measure the natural (unconstrained) rendered width of a text string. */
export function measureTextNaturalWidth(
	content: string,
	style: ResolvedStyleProps,
	measureRoot?: HTMLElement | null,
): number {
	const container = document.createElement("div");
	container.style.position = "absolute";
	container.style.visibility = "hidden";
	container.style.pointerEvents = "none";
	container.style.left = "-9999px";
	container.style.top = "0";
	container.style.whiteSpace = "nowrap";
	container.style.boxSizing = "border-box";
	container.innerHTML = content;
	applyStylesToElement(container, style);
	const parent = measureRoot ?? document.body;
	parent.appendChild(container);
	// Use getBoundingClientRect().width and round up so sub-pixel text never clips in the preview
	const width = Math.ceil(container.getBoundingClientRect().width);
	container.remove();
	return width;
}

export function measureTextHeight(
	content: string,
	width: number,
	style: ResolvedStyleProps,
	measureRoot?: HTMLElement | null,
): number {
	const container = document.createElement("div");
	container.style.position = "absolute";
	container.style.visibility = "hidden";
	container.style.pointerEvents = "none";
	container.style.left = "-9999px";
	container.style.top = "0";
	container.style.width = `${width}px`;
	container.style.boxSizing = "border-box";
	container.style.overflow = "hidden";
	container.innerHTML = content;
	applyStylesToElement(container, style);
	const parent = measureRoot ?? document.body;
	parent.appendChild(container);
	const height = container.offsetHeight;
	container.remove();
	return height;
}
