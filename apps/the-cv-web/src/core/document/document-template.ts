export interface StyleProps {
	// Layout
	position?: Value<"absolute" | "relative" | "static">;
	width?: Value<number | string>;
	height?: Value<number | string>;
	padding?: Value<SpaceValue>;
	margin?: Value<SpaceValue>;
	gap?: Value<SpaceValue>;

	// Typography
	fontFamily?: Value<string>;
	fontSize?: Value<number>;
	fontWeight?: Value<number | string>;
	fontStyle?: Value<"normal" | "italic" | "oblique">;
	lineHeight?: Value<number>;
	textAlign?: Value<"left" | "center" | "right" | "justify">;
	textTransform?: Value<"none" | "uppercase" | "lowercase" | "capitalize">;

	// Colors
	color?: Value<string>;
	backgroundColor?: Value<string>;
	borderColor?: Value<string>;

	// Border
	borderWidth?: Value<number>;
	borderRadius?: Value<number>;
}

export type FixedValue<T> = {
	kind: "fixed";
	value: T;
};

export type BoundValue = {
	kind: "bind";
	key: string;
};

export type Value<T> = FixedValue<T> | BoundValue;

export interface RowNode {
	id: string;
	kind: "row";
	gap?: number;
	style?: StyleProps;
	children: LayoutNode[];
}

export interface ColumnNode {
	id: string;
	kind: "column";
	gap?: number;
	style?: StyleProps;
	columns: LayoutBoxNode[];
}

export interface LayoutBoxNode {
	id: string;
	kind: "box";
	style?: StyleProps;
	children: LayoutNode[];
	unbreakable?: boolean;
}

export interface LayoutTextNode {
	id: string;
	kind: "text";
	src: Value<string>;
	style?: StyleProps;
}

export interface RichTextNode {
	id: string;
	kind: "rich-text";
	src: Value<string>;
	style?: StyleProps;
}

export interface ImageNode {
	id: string;
	kind: "image";
	src: Value<string>;
	style?: StyleProps;
}

export interface RepeatNode {
	id: string;
	kind: "repeat";
	source: string;
	children: LayoutNode[];
	breakable?: boolean;
}

export interface ConditionalNode {
	id: string;
	kind: "conditional";
	condition: BoundValue;
	children: LayoutNode[];
}

export type LayoutNode =
	| RowNode
	| ColumnNode
	| LayoutBoxNode
	| LayoutTextNode
	| RichTextNode
	| ImageNode
	| RepeatNode
	| ConditionalNode;

export type SpaceValue =
	| {
			top: number;
			right: number;
			bottom: number;
			left: number;
	  }
	| number;

export type SpaceDesignToken = {
	page: {
		padding: SpaceValue;
	};
};

export interface DesignTokens {
	colors: Record<string, string>;
	spaces: SpaceDesignToken;
	fonts: Record<string, number>;
}

export interface DocumentTemplate {
	id: string;
	name: string;
	tokens: DesignTokens;
	layout: LayoutNode;
}
