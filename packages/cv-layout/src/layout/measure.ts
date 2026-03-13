import type { ResolvedStyleProps, SpaceBox } from "../style-types.js";
import type {
	BlockBoxNode,
	BoxNode,
	FlexColumnBoxNode,
	FlexRowBoxNode,
	ImageBoxNode,
	TextBoxNode,
} from "./box-tree-types.js";
import { hasChildren } from "./box-tree-types.js";
import type { LayoutMeasureAdapter } from "./measure-adapter.js";

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

async function measureTextNode(node: TextBoxNode, adapter: LayoutMeasureAdapter): Promise<void> {
	const padding = getPadding(node.style);

	if (node.inFlexRow) {
		const maxContentWidth = getContentWidth(node.constraints, node.style);
		let naturalWidth: number;
		if (adapter.measureTextNaturalWidth) {
			naturalWidth = await adapter.measureTextNaturalWidth({
				content: node.text.content,
				style: node.style,
			});
		} else {
			naturalWidth = maxContentWidth;
		}

		if (naturalWidth <= maxContentWidth || maxContentWidth <= 0) {
			node.size.width = naturalWidth + padding.left + padding.right;
			node.text.measuredHeight = node.text.lineHeight;
			node.text.lineCount = 1;
			node.size.height = node.text.lineHeight + padding.top + padding.bottom;
		} else {
			const { height, lineCount } = await adapter.measureText({
				content: node.text.content,
				width: maxContentWidth,
				style: node.style,
				isHtml: node.text.isHtml,
			});
			node.text.measuredHeight = height;
			node.text.lineCount = Math.max(1, lineCount);
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
	const { height, lineCount } = await adapter.measureText({
		content: node.text.content,
		width: contentWidth,
		style: node.style,
		isHtml: node.text.isHtml,
	});
	node.text.measuredHeight = height;
	node.text.lineCount = Math.max(1, lineCount);
	node.size.width = node.constraints.maxWidth ?? contentWidth + padding.left + padding.right;
	node.size.height = height + padding.top + padding.bottom;
}

async function measureImageNode(
	node: ImageBoxNode,
	adapter: LayoutMeasureAdapter,
	cache: ImageSizeCache,
): Promise<void> {
	const cached = cache.get(node.src);
	if (cached) {
		node.size.width = cached.width;
		node.size.height = cached.height;
		return;
	}
	if (!node.src) {
		node.size.width = 0;
		node.size.height = 0;
		return;
	}
	const { width: w, height: h } = await adapter.getImageSize(node.src);
	const maxW = node.constraints.maxWidth;
	let width = w;
	let height = h;
	if (maxW != null && w > maxW) {
		const scale = maxW / w;
		width = maxW;
		height = Math.round(h * scale);
	}
	node.size.width = width;
	node.size.height = height;
	cache.set(node.src, { width, height });
}

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

	const gap = node.kind === "flex-column" ? node.gap : getGap(node.style, 0);
	const totalHeight = children.reduce((s, c) => s + c.size.height, 0) + gap * (children.length - 1);
	const maxWidth = node.constraints.maxWidth ?? Math.max(...children.map((c) => c.size.width), 0);
	node.size.width = maxWidth + padding.left + padding.right;
	node.size.height = totalHeight + padding.top + padding.bottom;
}

async function measureNodeRec(node: BoxNode, adapter: LayoutMeasureAdapter, cache: ImageSizeCache): Promise<void> {
	if (node.contentType === "text") {
		await measureTextNode(node as TextBoxNode, adapter);
		return;
	}
	if (node.contentType === "image") {
		await measureImageNode(node as ImageBoxNode, adapter, cache);
		return;
	}
	const container = node as BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode;
	for (const child of container.children) {
		await measureNodeRec(child, adapter, cache);
	}
	measureContainer(container);
}

/**
 * Fill box tree sizes in place (post-order) using the provided measure adapter.
 */
export async function measureBoxTree(
	root: BoxNode,
	adapter: LayoutMeasureAdapter,
	imageCache?: ImageSizeCache,
): Promise<void> {
	const cache = imageCache ?? new Map<string, { width: number; height: number }>();
	await measureNodeRec(root, adapter, cache);
}
