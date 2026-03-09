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

function getMargin(style: { margin?: number } | undefined): number {
	return typeof style?.margin === "number" ? style.margin : 0;
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
		const padding = typeof textNode.style.padding === "number" ? textNode.style.padding : 0;
		const isHtml = textNode.text.isHtml ?? false;
		const margin = getMargin(textNode.style);
		const totalHeightWithMargin = totalHeight + 2 * margin;

		if (totalHeight <= state.remainingHeight) {
			const content: FragmentTextContent = {
				kind: "text",
				fullContent: textNode.text.content,
				lineStart: 0,
				lineCount,
				style: textNode.style,
				isHtml,
			};
			emitFragment(state, getPosition(textNode), x, state.y, textNode.size.width, totalHeightWithMargin, content, null);
			state.y += totalHeightWithMargin;
			state.remainingHeight -= totalHeightWithMargin;
			return;
		}

		const linesThatFit = Math.max(0, Math.floor((state.remainingHeight - 2 * padding - 2 * margin) / lineHeight));
		if (linesThatFit <= 0) {
			newPage(state);
		}
		const firstPartLines = linesThatFit <= 0 ? lineCount : linesThatFit;
		const firstPartHeight = firstPartLines * lineHeight + 2 * padding;
		const firstPartHeightWithMargin = firstPartHeight + 2 * margin;
		const firstContent: FragmentTextContent = {
			kind: "text",
			fullContent: textNode.text.content,
			lineStart: 0,
			lineCount: firstPartLines,
			style: textNode.style,
			isHtml,
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
			const restHeight = restLines * lineHeight + 2 * padding;
			const restHeightWithMargin = restHeight + 2 * margin;
			const restContent: FragmentTextContent = {
				kind: "text",
				fullContent: textNode.text.content,
				lineStart: firstPartLines,
				lineCount: restLines,
				style: textNode.style,
				isHtml,
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
		const heightWithMargin = imgNode.size.height + 2 * margin;
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
			},
			null,
		);
		state.y += heightWithMargin;
		state.remainingHeight -= heightWithMargin;
		return;
	}

	// Container
	const container = node as BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode;
	if (!hasChildren(container) || container.children.length === 0) {
		const margin = getMargin(container.style);
		const hWithMargin = container.size.height + 2 * margin;
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

	const padding = typeof container.style.padding === "number" ? container.style.padding : 0;
	const childX = x + padding;
	const containerMargin = getMargin(container.style);
	// Reserve space for container margin-top so first child does not overlap previous sibling
	if (containerMargin > 0) {
		state.y += containerMargin;
		state.remainingHeight -= containerMargin;
	}
	for (const child of container.children) {
		paginateNode(state, child, childX);
	}
	closeContainer(state, x, getPosition(container));
	// Advance by container margin-bottom so next sibling does not overlap
	if (containerMargin > 0) {
		state.y += containerMargin;
		state.remainingHeight -= containerMargin;
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
