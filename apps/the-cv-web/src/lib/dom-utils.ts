import type { ResolvedStyleProps } from "../core/render/render-tree";

function applyStylesToElement(el: HTMLElement, style: ResolvedStyleProps): void {
	// Layout properties
	if (style.padding != null) el.style.padding = `${style.padding}px`;
	if (style.margin != null) el.style.margin = `${style.margin}px`;
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

export function measureTextHeight(content: string, width: number, style: ResolvedStyleProps): number {
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
	document.body.appendChild(container);
	const height = container.offsetHeight;
	container.remove();
	return height;
}
