import type { SpaceBox } from "@/core/render/render-tree";
import type {
	BlockBoxNode,
	BoxNode,
	FlexColumnBoxNode,
	FlexRowBoxNode,
	ImageBoxNode,
	TextBoxNode,
} from "./box-tree-types";
import { hasChildren } from "./box-tree-types";
import type {
	ContentRect,
	Fragment,
	FragmentBlockContent,
	FragmentPosition,
	FragmentTextContent,
	PageFragment,
} from "./fragment-tree";

/**
 * Convert a fully-measured BoxNode into a Fragment without modifying pagination state.
 * Used to build children of unbreakable inline containers (e.g. flex-row) without
 * advancing the page cursor.
 */
function emitBoxAsFragment(node: BoxNode, x: number, y: number, pageIndex: number): Fragment {
	if (node.contentType === "text") {
		const textNode = node as TextBoxNode;
		const lineCount = textNode.text.lineCount ?? 1;
		return {
			id: nextFragmentId(),
			pageIndex,
			position: "flow",
			x,
			y,
			width: textNode.size.width,
			height: textNode.size.height,
			content: {
				kind: "text",
				fullContent: textNode.text.content,
				lineStart: 0,
				lineCount,
				style: textNode.style,
				isHtml: textNode.text.isHtml ?? false,
				...(textNode.dataKey !== undefined && { dataKey: textNode.dataKey }),
			},
			nextFragmentId: null,
		};
	}

	if (node.contentType === "image") {
		const imgNode = node as ImageBoxNode;
		return {
			id: nextFragmentId(),
			pageIndex,
			position: "flow",
			x,
			y,
			width: imgNode.size.width,
			height: imgNode.size.height,
			content: {
				kind: "image",
				src: imgNode.src,
				alt: imgNode.alt,
				style: imgNode.style,
				...(imgNode.dataKey !== undefined && { dataKey: imgNode.dataKey }),
			},
			nextFragmentId: null,
		};
	}

	const container = node as BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode;
	const padding = getPadding(container.style);
	const isRow = container.kind === "flex-row";
	const children: Fragment[] = [];

	if (isRow) {
		const rowNode = container as FlexRowBoxNode;
		let childX = x + padding.left;
		const childY = y + padding.top;
		for (const child of rowNode.children) {
			children.push(emitBoxAsFragment(child, childX, childY, pageIndex));
			childX += child.size.width + rowNode.gap;
		}
	} else {
		const gapVal = container.kind === "flex-column" ? (container as FlexColumnBoxNode).gap : 0;
		let childY = y + padding.top;
		for (const child of (container as BlockBoxNode | FlexColumnBoxNode).children) {
			children.push(emitBoxAsFragment(child, x + padding.left, childY, pageIndex));
			childY += child.size.height + gapVal;
		}
	}

	return {
		id: nextFragmentId(),
		pageIndex,
		position: "flow",
		x,
		y,
		width: node.size.width,
		height: node.size.height,
		content: { kind: "block", children, isRow },
		nextFragmentId: null,
	};
}

let fragmentIdCounter = 0;
function nextFragmentId(): string {
	return `frag-${++fragmentIdCounter}`;
}

interface PaginationState {
	pageIndex: number;
	y: number;
	remainingHeight: number;
	pages: PageFragment[];
	rect: ContentRect;
	/** When inside a container: fragment count per page at container entry (for grouping). */
	containerStack: number[][];
}

function ensurePage(state: PaginationState): void {
	while (state.pages.length <= state.pageIndex) {
		state.pages.push({
			pageIndex: state.pages.length,
			contentTop: state.rect.contentTop,
			contentLeft: state.rect.contentLeft,
			contentWidth: state.rect.contentWidth,
			contentHeight: state.rect.contentHeight,
			pageWidthPx: state.rect.pageWidthPx,
			pageHeightPx: state.rect.pageHeightPx,
			fragments: [],
		});
	}
}

function newPage(state: PaginationState): void {
	state.pageIndex += 1;
	ensurePage(state);
	state.y = state.rect.contentTop;
	state.remainingHeight = state.rect.contentHeight;
}

function getPosition(node: BoxNode): FragmentPosition {
	return node.style?.position === "absolute" ? "absolute" : "flow";
}

const defaultSpaceBox: SpaceBox = { top: 0, right: 0, bottom: 0, left: 0 };

function getMargin(style: { margin?: SpaceBox } | undefined): SpaceBox {
	return style?.margin ?? defaultSpaceBox;
}

function getPadding(style: { padding?: SpaceBox } | undefined): SpaceBox {
	return style?.padding ?? defaultSpaceBox;
}

function emitFragment(
	state: PaginationState,
	position: FragmentPosition,
	x: number,
	y: number,
	width: number,
	height: number,
	content: Fragment["content"],
	nextFragId: string | null,
): Fragment {
	ensurePage(state);
	const id = nextFragmentId();
	const frag: Fragment = {
		id,
		pageIndex: state.pageIndex,
		position,
		x,
		y,
		width,
		height,
		content,
		nextFragmentId: nextFragId,
	};
	state.pages[state.pageIndex].fragments.push(frag);
	return frag;
}

/** Pop container from stack and wrap its child fragments into block fragment(s) per page. */
function closeContainer(state: PaginationState, startX: number, position: FragmentPosition): void {
	const startCounts = state.containerStack.pop();
	if (!startCounts) return;

	for (let pi = 0; pi < state.pages.length; pi++) {
		const start = startCounts[pi] ?? 0;
		const frags = state.pages[pi].fragments;
		if (frags.length <= start) continue;

		const children = frags.splice(start, frags.length - start);
		if (children.length === 0) continue;

		let minY = children[0].y;
		let maxY = children[0].y + children[0].height;
		let maxW = children[0].width;
		for (let i = 1; i < children.length; i++) {
			const c = children[i];
			minY = Math.min(minY, c.y);
			maxY = Math.max(maxY, c.y + c.height);
			maxW = Math.max(maxW, c.width);
		}
		const blockContent: FragmentBlockContent = { kind: "block", children };
		const id = nextFragmentId();
		const blockHeight = maxY - minY;
		const blockFrag: Fragment = {
			id,
			pageIndex: pi,
			position,
			x: startX,
			y: minY,
			width: maxW,
			height: blockHeight,
			content: blockContent,
			nextFragmentId: null,
		};
		frags.splice(start, 0, blockFrag);
	}
}

function paginateNode(state: PaginationState, node: BoxNode, x: number): void {
	if (
		node.unbreakable &&
		node.size.height > state.remainingHeight &&
		state.remainingHeight < state.rect.contentHeight
	) {
		newPage(state);
	}

	if (node.contentType === "text") {
		const textNode = node as TextBoxNode;
		const lineHeight = textNode.text.lineHeight;
		const lineCount = textNode.text.lineCount ?? 1;
		const totalHeight = textNode.size.height;
		const padding = getPadding(textNode.style);
		const isHtml = textNode.text.isHtml ?? false;
		const margin = getMargin(textNode.style);
		const totalHeightWithMargin = totalHeight + margin.top + margin.bottom;

		if (totalHeightWithMargin <= state.remainingHeight) {
			const content: FragmentTextContent = {
				kind: "text",
				fullContent: textNode.text.content,
				lineStart: 0,
				lineCount,
				style: textNode.style,
				isHtml,
				...(textNode.dataKey !== undefined && { dataKey: textNode.dataKey }),
			};
			emitFragment(state, getPosition(textNode), x, state.y, textNode.size.width, totalHeightWithMargin, content, null);
			state.y += totalHeightWithMargin;
			state.remainingHeight -= totalHeightWithMargin;
			return;
		}

		const linesThatFit = Math.max(
			0,
			Math.floor((state.remainingHeight - padding.top - padding.bottom - margin.top - margin.bottom) / lineHeight),
		);
		if (linesThatFit <= 0) {
			newPage(state);
		}
		const firstPartLines = linesThatFit <= 0 ? lineCount : linesThatFit;
		const firstPartHeight = firstPartLines * lineHeight + padding.top + padding.bottom;
		const firstPartHeightWithMargin = firstPartHeight + margin.top + margin.bottom;
		const firstContent: FragmentTextContent = {
			kind: "text",
			fullContent: textNode.text.content,
			lineStart: 0,
			lineCount: firstPartLines,
			style: textNode.style,
			isHtml,
			...(textNode.dataKey !== undefined && { dataKey: textNode.dataKey }),
		};
		const frag1 = emitFragment(
			state,
			getPosition(textNode),
			x,
			state.y,
			textNode.size.width,
			firstPartHeightWithMargin,
			firstContent,
			null,
		);
		state.y += firstPartHeightWithMargin;
		state.remainingHeight -= firstPartHeightWithMargin;

		const restLines = lineCount - firstPartLines;
		if (restLines > 0) {
			newPage(state);
			const restHeight = restLines * lineHeight + padding.top + padding.bottom;
			const restHeightWithMargin = restHeight + margin.top + margin.bottom;
			const restContent: FragmentTextContent = {
				kind: "text",
				fullContent: textNode.text.content,
				lineStart: firstPartLines,
				lineCount: restLines,
				style: textNode.style,
				isHtml,
				...(textNode.dataKey !== undefined && { dataKey: textNode.dataKey }),
			};
			const frag2 = emitFragment(
				state,
				getPosition(textNode),
				x,
				state.y,
				textNode.size.width,
				restHeightWithMargin,
				restContent,
				null,
			);
			frag1.nextFragmentId = frag2.id;
			state.y += restHeightWithMargin;
			state.remainingHeight -= restHeightWithMargin;
		}
		return;
	}

	if (node.contentType === "image") {
		const imgNode = node as ImageBoxNode;
		const margin = getMargin(imgNode.style);
		const heightWithMargin = imgNode.size.height + margin.top + margin.bottom;
		emitFragment(
			state,
			getPosition(imgNode),
			x,
			state.y,
			imgNode.size.width,
			heightWithMargin,
			{
				kind: "image",
				src: imgNode.src,
				alt: imgNode.alt,
				style: imgNode.style,
				...(imgNode.dataKey !== undefined && { dataKey: imgNode.dataKey }),
			},
			null,
		);
		state.y += heightWithMargin;
		state.remainingHeight -= heightWithMargin;
		return;
	}

	// Flex-row: emit all children side-by-side as a single atomic block fragment
	if (node.kind === "flex-row") {
		const rowNode = node as FlexRowBoxNode;
		const margin = getMargin(rowNode.style);
		const padding = getPadding(rowNode.style);

		if (margin.top > 0) {
			state.y += margin.top;
			state.remainingHeight -= margin.top;
		}

		const rowY = state.y;
		let childX = x + padding.left;
		const childY = rowY + padding.top;
		const children: Fragment[] = [];

		for (const child of rowNode.children) {
			children.push(emitBoxAsFragment(child, childX, childY, state.pageIndex));
			childX += child.size.width + rowNode.gap;
		}

		emitFragment(
			state,
			getPosition(rowNode),
			x,
			rowY,
			rowNode.size.width,
			rowNode.size.height,
			{ kind: "block", children, isRow: true },
			null,
		);

		state.y += rowNode.size.height;
		state.remainingHeight -= rowNode.size.height;

		if (margin.bottom > 0) {
			state.y += margin.bottom;
			state.remainingHeight -= margin.bottom;
		}
		return;
	}

	// Container
	const container = node as BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode;
	if (!hasChildren(container) || container.children.length === 0) {
		const margin = getMargin(container.style);
		const hWithMargin = container.size.height + margin.top + margin.bottom;
		emitFragment(
			state,
			getPosition(container),
			x,
			state.y,
			container.size.width,
			hWithMargin,
			{ kind: "block", children: [] },
			null,
		);
		state.y += hWithMargin;
		state.remainingHeight -= hWithMargin;
		return;
	}

	// Record fragment counts per page so we can group children into one block later
	const startCounts = state.pages.map((p) => p.fragments.length);
	state.containerStack.push(startCounts);

	const padding = getPadding(container.style);
	const childX = x + padding.left;
	const containerMargin = getMargin(container.style);
	// Reserve space for container margin-top so first child does not overlap previous sibling
	if (containerMargin.top > 0) {
		state.y += containerMargin.top;
		state.remainingHeight -= containerMargin.top;
	}
	for (const child of container.children) {
		paginateNode(state, child, childX);
	}
	closeContainer(state, x, getPosition(container));
	// Advance by container margin-bottom so next sibling does not overlap
	if (containerMargin.bottom > 0) {
		state.y += containerMargin.bottom;
		state.remainingHeight -= containerMargin.bottom;
	}
}

/**
 * One-pass pagination: traverse measured box tree and produce fragment tree.
 */
export function paginate(root: BoxNode, rect: ContentRect): PageFragment[] {
	fragmentIdCounter = 0;
	const state: PaginationState = {
		pageIndex: 0,
		y: rect.contentTop,
		remainingHeight: rect.contentHeight,
		pages: [],
		rect,
		containerStack: [],
	};
	ensurePage(state);
	paginateNode(state, root, rect.contentLeft);
	return state.pages;
}
