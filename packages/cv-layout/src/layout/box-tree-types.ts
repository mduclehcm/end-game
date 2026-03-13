import type { ResolvedStyleProps } from "../style-types.js";

export type BoxKind = "block" | "inline" | "flex-row" | "flex-column";
export type BoxContentType = "container" | "text" | "image";

export interface BoxConstraints {
	maxWidth?: number;
	maxHeight?: number;
}

export interface BoxSize {
	width: number;
	height: number;
}

export interface TextRun {
	content: string;
	lineHeight: number;
	measuredHeight?: number;
	lineCount?: number;
	isHtml?: boolean;
}

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

export interface FlexRowBoxNode {
	id: string;
	kind: "flex-row";
	contentType: "container";
	style: ResolvedStyleProps;
	gap: number;
	constraints: BoxConstraints;
	size: BoxSize;
	children: BoxNode[];
	unbreakable?: boolean;
}

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

export interface TextBoxNode {
	id: string;
	kind: "block";
	contentType: "text";
	style: ResolvedStyleProps;
	constraints: BoxConstraints;
	size: BoxSize;
	text: TextRun;
	unbreakable?: boolean;
	inFlexRow?: boolean;
	dataKey?: string;
}

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
