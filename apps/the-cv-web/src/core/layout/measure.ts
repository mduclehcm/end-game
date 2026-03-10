import type { ResolvedStyleProps, SpaceBox } from "@/core/render/render-tree";
import { measureTextHeight, measureTextNaturalWidth } from "@/lib/dom-utils";
import type {
	BlockBoxNode,
	BoxNode,
	FlexColumnBoxNode,
	FlexRowBoxNode,
	ImageBoxNode,
	TextBoxNode,
} from "./box-tree-types";
import { hasChildren } from "./box-tree-types";

export type ImageSizeCache = Map<string, { width: number; height: number }>;

const defaultSpaceBox: SpaceBox = { top: 0, right: 0, bottom: 0, left: 0 };

function getContentWidth(constraints: { maxWidth?: number }, style: ResolvedStyleProps): number {
	const w = constraints.maxWidth ?? 0;
	const padding = style.padding ?? defaultSpaceBox;
	return Math.max(0, w - padding.left - padding.right);
}

function getPadding(style: ResolvedStyleProps): SpaceBox {
	return style.padding ?? defaultSpaceBox;
}

function getGap(style: ResolvedStyleProps, fallback: number): number {
	return typeof style.gap === "number" ? style.gap : fallback;
}

/** Measure a single text box: set size and text.measuredHeight, text.lineCount. */
function measureTextNode(node: TextBoxNode, measureRoot?: HTMLElement | null): void {
	const padding = getPadding(node.style);

	if (node.inFlexRow) {
		// Use natural width when text fits on one line; fall back to constrained wrapping if it overflows.
		const naturalWidth = measureTextNaturalWidth(node.text.content, node.style, measureRoot);
		const maxContentWidth = getContentWidth(node.constraints, node.style);

		if (naturalWidth <= maxContentWidth || maxContentWidth <= 0) {
			node.size.width = naturalWidth + padding.left + padding.right;
			node.text.measuredHeight = node.text.lineHeight;
			node.text.lineCount = 1;
			node.size.height = node.text.lineHeight + padding.top + padding.bottom;
		} else {
			// Text is wider than available space — constrain and allow wrapping
			const height = measureTextHeight(node.text.content, maxContentWidth, node.style, measureRoot);
			node.text.measuredHeight = height;
			node.text.lineCount = Math.max(1, Math.ceil(height / node.text.lineHeight));
			node.size.width = maxContentWidth + padding.left + padding.right;
			node.size.height = height + padding.top + padding.bottom;
		}
		return;
	}

	const contentWidth = getContentWidth(node.constraints, node.style);
	if (contentWidth <= 0) {
		node.size.width = 0;
		node.size.height = 0;
		node.text.measuredHeight = 0;
		node.text.lineCount = 0;
		return;
	}
	const height = measureTextHeight(node.text.content, contentWidth, node.style, measureRoot);
	node.text.measuredHeight = height;
	node.text.lineCount = Math.max(1, Math.ceil(height / node.text.lineHeight));
	node.size.width = node.constraints.maxWidth ?? contentWidth + padding.left + padding.right;
	node.size.height = height + padding.top + padding.bottom;
}

/** Measure image: load or use cache, set size. */
function measureImageNode(node: ImageBoxNode, cache: ImageSizeCache): Promise<void> {
	return new Promise((resolve) => {
		const cached = cache.get(node.src);
		if (cached) {
			node.size.width = cached.width;
			node.size.height = cached.height;
			resolve();
			return;
		}
		if (!node.src) {
			node.size.width = 0;
			node.size.height = 0;
			resolve();
			return;
		}
		const img = new Image();
		img.onload = () => {
			let w = img.naturalWidth;
			let h = img.naturalHeight;
			const maxW = node.constraints.maxWidth;
			if (maxW != null && w > maxW) {
				const scale = maxW / w;
				w = maxW;
				h = Math.round(h * scale);
			}
			node.size.width = w;
			node.size.height = h;
			cache.set(node.src, { width: w, height: h });
			resolve();
		};
		img.onerror = () => {
			node.size.width = 0;
			node.size.height = 0;
			resolve();
		};
		img.src = node.src;
	});
}

/** Measure container (block, flex-row, flex-column) after children are measured. */
function measureContainer(node: BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode): void {
	if (!hasChildren(node) || node.children.length === 0) {
		node.size.width = node.constraints.maxWidth ?? 0;
		const padding = getPadding(node.style);
		node.size.height = padding.top + padding.bottom;
		return;
	}
	const padding = getPadding(node.style);
	const children = node.children;

	if (node.kind === "flex-row") {
		const gap = node.gap;
		const totalWidth = children.reduce((s, c) => s + c.size.width, 0) + gap * (children.length - 1);
		const maxHeight = Math.max(...children.map((c) => c.size.height));
		node.size.width = totalWidth + padding.left + padding.right;
		node.size.height = maxHeight + padding.top + padding.bottom;
		return;
	}

	// block or flex-column: vertical stack
	const gap = node.kind === "flex-column" ? node.gap : getGap(node.style, 0);
	const totalHeight = children.reduce((s, c) => s + c.size.height, 0) + gap * (children.length - 1);
	const maxWidth = node.constraints.maxWidth ?? Math.max(...children.map((c) => c.size.width), 0);
	node.size.width = maxWidth + padding.left + padding.right;
	node.size.height = totalHeight + padding.top + padding.bottom;
}

async function measureNodeRec(node: BoxNode, cache: ImageSizeCache, measureRoot?: HTMLElement | null): Promise<void> {
	if (node.contentType === "text") {
		measureTextNode(node as TextBoxNode, measureRoot);
		return;
	}
	if (node.contentType === "image") {
		await measureImageNode(node as ImageBoxNode, cache);
		return;
	}
	// container
	const container = node as BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode;
	for (const child of container.children) {
		await measureNodeRec(child, cache, measureRoot);
	}
	measureContainer(container);
}

/**
 * Fill box tree sizes in place (post-order).
 * Uses real DOM for text via measureTextHeight; images loaded async (or from cache).
 * When measureRoot is provided, text is measured in that element's font/layout context (e.g. preview container).
 */
export async function measureBoxTree(
	root: BoxNode,
	imageCache?: ImageSizeCache,
	measureRoot?: HTMLElement | null,
): Promise<void> {
	const cache = imageCache ?? new Map<string, { width: number; height: number }>();
	await measureNodeRec(root, cache, measureRoot);
}
