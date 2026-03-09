import type { ResolvedStyleProps } from "@/core/render/render-tree";
import { measureTextHeight } from "@/lib/dom-utils";
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

function getContentWidth(constraints: { maxWidth?: number }, style: ResolvedStyleProps): number {
	const w = constraints.maxWidth ?? 0;
	const padding = typeof style.padding === "number" ? style.padding : 0;
	return Math.max(0, w - 2 * padding);
}

function getPadding(style: ResolvedStyleProps): number {
	return typeof style.padding === "number" ? style.padding : 0;
}

function getGap(style: ResolvedStyleProps, fallback: number): number {
	return typeof style.gap === "number" ? style.gap : fallback;
}

/** Measure a single text box: set size and text.measuredHeight, text.lineCount. */
function measureTextNode(node: TextBoxNode): void {
	const contentWidth = getContentWidth(node.constraints, node.style);
	if (contentWidth <= 0) {
		node.size.width = 0;
		node.size.height = 0;
		node.text.measuredHeight = 0;
		node.text.lineCount = 0;
		return;
	}
	const height = measureTextHeight(node.text.content, contentWidth, node.style);
	node.text.measuredHeight = height;
	node.text.lineCount = Math.max(1, Math.ceil(height / node.text.lineHeight));
	node.size.width = node.constraints.maxWidth ?? contentWidth + 2 * getPadding(node.style);
	node.size.height = height + 2 * getPadding(node.style);
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
		node.size.height = 2 * getPadding(node.style);
		return;
	}
	const padding = getPadding(node.style);
	const children = node.children;

	if (node.kind === "flex-row") {
		const gap = node.gap;
		const totalWidth = children.reduce((s, c) => s + c.size.width, 0) + gap * (children.length - 1);
		const maxHeight = Math.max(...children.map((c) => c.size.height));
		node.size.width = totalWidth + 2 * padding;
		node.size.height = maxHeight + 2 * padding;
		return;
	}

	// block or flex-column: vertical stack
	const gap = node.kind === "flex-column" ? node.gap : getGap(node.style, 0);
	const totalHeight = children.reduce((s, c) => s + c.size.height, 0) + gap * (children.length - 1);
	const maxWidth = node.constraints.maxWidth ?? Math.max(...children.map((c) => c.size.width), 0);
	node.size.width = maxWidth + 2 * padding;
	node.size.height = totalHeight + 2 * padding;
}

async function measureNodeRec(node: BoxNode, cache: ImageSizeCache): Promise<void> {
	if (node.contentType === "text") {
		measureTextNode(node as TextBoxNode);
		return;
	}
	if (node.contentType === "image") {
		await measureImageNode(node as ImageBoxNode, cache);
		return;
	}
	// container
	const container = node as BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode;
	for (const child of container.children) {
		await measureNodeRec(child, cache);
	}
	measureContainer(container);
}

/**
 * Fill box tree sizes in place (post-order).
 * Uses real DOM for text via measureTextHeight; images loaded async (or from cache).
 */
export async function measureBoxTree(root: BoxNode, imageCache?: ImageSizeCache): Promise<void> {
	const cache = imageCache ?? new Map<string, { width: number; height: number }>();
	await measureNodeRec(root, cache);
}
