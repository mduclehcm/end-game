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
import type { ExpandedLayoutNode } from "./expand-layout";

const defaultConstraints: BoxConstraints = {};

function buildBoxFromExpanded(
	node: ExpandedLayoutNode,
	contentWidth: number,
	parentConstraints: BoxConstraints,
): BoxNode {
	const constraints: BoxConstraints = {
		...parentConstraints,
		maxWidth: contentWidth,
	};
	const emptySize = { width: 0, height: 0 };

	switch (node.kind) {
		case "box": {
			const children = node.children.map((c) => buildBoxFromExpanded(c, contentWidth, constraints));
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
			const children = node.children.map((c) => buildBoxFromExpanded(c, contentWidth, constraints));
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
			const children = node.children.map((c) => buildBoxFromExpanded(c, contentWidth, constraints));
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
			} satisfies TextBoxNode;
		}
		case "rich-text": {
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
			} satisfies TextBoxNode;
		}
		case "image": {
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
	return buildBoxFromExpanded(expanded, contentWidth, defaultConstraints);
}
