import type { ResolvedStyleProps } from "@/core/render/render-tree";

export type BoxKind = "block" | "inline" | "flex-row" | "flex-column";
export type BoxContentType = "container" | "text" | "image";

export interface BoxConstraints {
	maxWidth?: number;
	maxHeight?: number;
}

/** Base fields shared by all box nodes (filled in during measurement). */
export interface BoxSize {
	width: number;
	height: number;
}

/** Text run for measurement; line breaks / line height filled during measurement. */
export interface TextRun {
	content: string;
	/** Line height in px (from style or measured). */
	lineHeight: number;
	/** Total height of the text block (filled by measurement). */
	measuredHeight?: number;
	/** Estimated line count (filled by measurement: ceil(height / lineHeight)). */
	lineCount?: number;
	/** When true, content is HTML and should be rendered with innerHTML. */
	isHtml?: boolean;
}

// --- Block (BFC): vertical stack -----------------------------------------------

export interface BlockBoxNode {
	id: string;
	kind: "block";
	contentType: "container";
	style: ResolvedStyleProps;
	constraints: BoxConstraints;
	size: BoxSize;
	children: BoxNode[];
	unbreakable?: boolean;
}

// --- Flex row: horizontal with gap -------------------------------------------

export interface FlexRowBoxNode {
	id: string;
	kind: "flex-row";
	contentType: "container";
	style: ResolvedStyleProps;
	gap: number;
	constraints: BoxConstraints;
	size: BoxSize;
	children: BoxNode[];
	/** Rows are kept together by default (unbreakable). */
	unbreakable?: boolean;
}

// --- Flex column (or BFC): vertical with gap ---------------------------------

export interface FlexColumnBoxNode {
	id: string;
	kind: "flex-column";
	contentType: "container";
	style: ResolvedStyleProps;
	gap: number;
	constraints: BoxConstraints;
	size: BoxSize;
	children: BoxNode[];
	unbreakable?: boolean;
}

// --- Inline / text: anonymous block wrapping text run -------------------------

export interface TextBoxNode {
	id: string;
	kind: "block";
	contentType: "text";
	style: ResolvedStyleProps;
	constraints: BoxConstraints;
	size: BoxSize;
	/** Single text run; measured as one block, then lineCount/lineHeight for pagination. */
	text: TextRun;
	unbreakable?: boolean;
	/** When true, node is a direct child of a flex-row; measure natural (unconstrained) text width. */
	inFlexRow?: boolean;
	/** Document path for bound value (e.g. content.personal.email). Used for active field highlight. */
	dataKey?: string;
}

// --- Image: replaced block ----------------------------------------------------

export interface ImageBoxNode {
	id: string;
	kind: "block";
	contentType: "image";
	style: ResolvedStyleProps;
	constraints: BoxConstraints;
	size: BoxSize;
	src: string;
	alt?: string;
	unbreakable?: boolean;
	dataKey?: string;
}

export type BoxNode = BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode | TextBoxNode | ImageBoxNode;

export function isContainerBox(node: BoxNode): node is BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode {
	return node.contentType === "container";
}

export function hasChildren(node: BoxNode): node is BlockBoxNode | FlexRowBoxNode | FlexColumnBoxNode {
	return "children" in node && Array.isArray((node as BlockBoxNode).children);
}
