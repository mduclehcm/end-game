import type { Value } from "../document";

export interface ResolvedStyleProps {
	width?: number | string;
	height?: number | string;
	padding?: number;
	margin?: number;
	gap?: number;

	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;
	fontStyle?: "normal" | "italic" | "oblique";
	lineHeight?: number;
	textAlign?: "left" | "center" | "right" | "justify";
	textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";

	color?: string;
	backgroundColor?: string;
	borderColor?: string;

	borderWidth?: number;
	borderRadius?: number;
}

// Row: horizontal layout
export interface RowNode {
	id: string;
	kind: "row";
	gap?: Value<number>;
	style?: ResolvedStyleProps;
	children?: RenderTree[];
}

// Column: vertical layout
export interface ColumnNode {
	id: string;
	kind: "column";
	gap?: Value<number>;
	style?: ResolvedStyleProps;
	columns: RenderBoxNode[];
}

// Box: generic container
export interface RenderBoxNode {
	kind: "box";
	id: string;
	style: ResolvedStyleProps;
	children: RenderTree[];
}

// Text: plain text
export interface RenderTextNode {
	id: string;
	kind: "text";
	src: Value<string>;
	style: ResolvedStyleProps;
}

// RichText: formatted text
export interface RichTextNode {
	id: string;
	kind: "rich-text";
	value: Value<string>;
	style?: ResolvedStyleProps;
}

// Image: image
export interface ImageNode {
	id: string;
	kind: "image";
	src: Value<string>;
	style?: ResolvedStyleProps;
}

export type RenderTree = RowNode | ColumnNode | RenderBoxNode | RenderTextNode | RichTextNode | ImageNode;
