import type { ResolvedStyleProps, SpaceBox } from "@/core/render/render-tree";
import type {
	BlockBoxNode,
	BoxConstraints,
	BoxNode,
	FlexColumnBoxNode,
	FlexRowBoxNode,
	ImageBoxNode,
	TextBoxNode,
	TextRun,
} from "./box-tree-types";
import type {
	ExpandedBoxNode,
	ExpandedImageNode,
	ExpandedLayoutNode,
	ExpandedRichTextNode,
	ExpandedTextNode,
} from "./expand-layout";

const defaultConstraints: BoxConstraints = {};

const defaultSpaceBox: SpaceBox = { top: 0, right: 0, bottom: 0, left: 0 };

function getPadding(style: ResolvedStyleProps | undefined): SpaceBox {
	if (!style?.padding) return defaultSpaceBox;
	return style.padding;
}

/** Content width available for children after subtracting container padding. */
function innerContentWidth(contentWidth: number, style: ResolvedStyleProps | undefined): number {
	const padding = getPadding(style);
	return Math.max(0, contentWidth - padding.left - padding.right);
}

function buildBoxFromExpanded(
	node: ExpandedLayoutNode,
	contentWidth: number,
	parentConstraints: BoxConstraints,
): BoxNode {
	const emptySize = { width: 0, height: 0 };

	switch (node.kind) {
		case "box": {
			const childContentWidth = innerContentWidth(contentWidth, node.style);
			const constraints: BoxConstraints = {
				...parentConstraints,
				maxWidth: childContentWidth,
			};
			const children = node.children.map((c) => buildBoxFromExpanded(c, childContentWidth, constraints));
			return {
				id: node.id,
				kind: "block",
				contentType: "container",
				style: node.style,
				constraints: { ...constraints },
				size: { ...emptySize },
				children,
				unbreakable: node.unbreakable,
			} satisfies BlockBoxNode;
		}
		case "row": {
			const childContentWidthRow = innerContentWidth(contentWidth, node.style);
			const constraints: BoxConstraints = {
				...parentConstraints,
				maxWidth: childContentWidthRow,
			};
			const children = node.children.map((c) => buildBoxFromExpanded(c, childContentWidthRow, constraints));
			// Mark direct text children so measurement uses natural (unconstrained) width
			for (const child of children) {
				if (child.contentType === "text") {
					(child as TextBoxNode).inFlexRow = true;
				}
			}
			return {
				id: node.id,
				kind: "flex-row",
				contentType: "container",
				style: node.style,
				gap: node.gap,
				constraints: { ...constraints },
				size: { ...emptySize },
				children,
				unbreakable: true,
			} satisfies FlexRowBoxNode;
		}
		case "column": {
			const childContentWidthCol = innerContentWidth(contentWidth, node.style);
			const constraints: BoxConstraints = {
				...parentConstraints,
				maxWidth: childContentWidthCol,
			};
			const children = node.children.map((c) => buildBoxFromExpanded(c, childContentWidthCol, constraints));
			return {
				id: node.id,
				kind: "flex-column",
				contentType: "container",
				style: node.style,
				gap: node.gap,
				constraints: { ...constraints },
				size: { ...emptySize },
				children,
				unbreakable: false,
			} satisfies FlexColumnBoxNode;
		}
		case "text": {
			const t = node as ExpandedTextNode;
			const constraints: BoxConstraints = {
				...parentConstraints,
				maxWidth: contentWidth,
			};
			const lineHeight = node.style.lineHeight ?? (node.style.fontSize ? node.style.fontSize * 1.2 : 16);
			const textRun: TextRun = {
				content: node.content,
				lineHeight: typeof lineHeight === "number" ? lineHeight : 16,
			};
			return {
				id: node.id,
				kind: "block",
				contentType: "text",
				style: node.style,
				constraints: { ...constraints },
				size: { ...emptySize },
				text: textRun,
				unbreakable: false,
				...(t.dataKey !== undefined && { dataKey: t.dataKey }),
			} satisfies TextBoxNode;
		}
		case "rich-text": {
			const rt = node as ExpandedRichTextNode;
			const constraints: BoxConstraints = {
				...parentConstraints,
				maxWidth: contentWidth,
			};
			const lineHeight = node.style.lineHeight ?? (node.style.fontSize ? node.style.fontSize * 1.2 : 16);
			const textRun: TextRun = {
				content: node.content,
				lineHeight: typeof lineHeight === "number" ? lineHeight : 16,
				isHtml: true,
			};
			return {
				id: node.id,
				kind: "block",
				contentType: "text",
				style: node.style,
				constraints: { ...constraints },
				size: { ...emptySize },
				text: textRun,
				unbreakable: false,
				...(rt.dataKey !== undefined && { dataKey: rt.dataKey }),
			} satisfies TextBoxNode;
		}
		case "image": {
			const img = node as ExpandedImageNode;
			const constraints: BoxConstraints = {
				...parentConstraints,
				maxWidth: contentWidth,
			};
			return {
				id: node.id,
				kind: "block",
				contentType: "image",
				style: node.style,
				constraints: { ...constraints },
				size: { ...emptySize },
				src: node.src,
				alt: node.alt,
				unbreakable: false,
				...(img.dataKey !== undefined && { dataKey: img.dataKey }),
			} satisfies ImageBoxNode;
		}
	}
}

/**
 * Build box tree from expanded layout tree.
 * Sizes are left at 0 until measurement pass.
 *
 * @param expanded - Single root from expandLayoutTree (or null)
 * @param contentWidth - Page content width in px (constraint for root)
 */
export function buildBoxTree(expanded: ExpandedLayoutNode | null, contentWidth: number): BoxNode | null {
	if (!expanded) return null;
	// #region agent log
	const rootPadding = expanded.kind === "box" ? (expanded as ExpandedBoxNode).style?.padding : undefined;
	fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
		method: "POST",
		headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "899923" },
		body: JSON.stringify({
			sessionId: "899923",
			location: "build-box-tree.ts:buildBoxTree",
			message: "root expanded style",
			data: { rootPadding },
			timestamp: Date.now(),
			hypothesisId: "H4",
		}),
	}).catch(() => {});
	// #endregion
	return buildBoxFromExpanded(expanded, contentWidth, defaultConstraints);
}
