import type { CSSProperties } from "react";
import { spaceBoxToCss } from "@/core/render/render-tree";

/**
 * Convert template style object to React CSS properties.
 * Handles unit conversion (px), type casting, and CSS property mapping.
 */
// biome-ignore lint/suspicious/noExplicitAny: Template styles are dynamic
export function convertStyle(style: any): CSSProperties | undefined {
	if (!style) return undefined;

	const cssStyle: CSSProperties = {};

	// Layout
	if (style.width !== undefined) {
		cssStyle.width = typeof style.width === "number" ? `${style.width}px` : style.width;
	}
	if (style.height !== undefined) {
		cssStyle.height = typeof style.height === "number" ? `${style.height}px` : style.height;
	}
	if (style.padding !== undefined) {
		cssStyle.padding = spaceBoxToCss(style.padding);
	}
	if (style.margin !== undefined) {
		cssStyle.margin = spaceBoxToCss(style.margin);
	}

	// Typography
	if (style.fontFamily !== undefined) {
		cssStyle.fontFamily = String(style.fontFamily);
	}
	if (style.fontSize !== undefined) {
		cssStyle.fontSize = `${style.fontSize}px`;
	}
	if (style.fontWeight !== undefined) {
		cssStyle.fontWeight = style.fontWeight as CSSProperties["fontWeight"];
	}
	if (style.fontStyle !== undefined) {
		cssStyle.fontStyle = style.fontStyle as CSSProperties["fontStyle"];
	}
	if (style.lineHeight !== undefined) {
		cssStyle.lineHeight = style.lineHeight;
	}
	if (style.textAlign !== undefined) {
		cssStyle.textAlign = style.textAlign as CSSProperties["textAlign"];
	}
	if (style.textTransform !== undefined) {
		cssStyle.textTransform = style.textTransform as CSSProperties["textTransform"];
	}

	// Colors
	if (style.color !== undefined) {
		cssStyle.color = String(style.color);
	}
	if (style.backgroundColor !== undefined) {
		cssStyle.backgroundColor = String(style.backgroundColor);
	}
	if (style.borderColor !== undefined) {
		cssStyle.borderColor = String(style.borderColor);
	}

	// Border
	if (style.borderWidth !== undefined) {
		cssStyle.borderWidth = `${style.borderWidth}px`;
		cssStyle.borderStyle = "solid";
	}
	if (style.borderRadius !== undefined) {
		cssStyle.borderRadius = `${style.borderRadius}px`;
	}

	return cssStyle;
}
