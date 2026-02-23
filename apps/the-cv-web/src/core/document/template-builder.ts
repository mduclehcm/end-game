import type {
	BoundValue,
	ColumnNode,
	ConditionalNode,
	FixedValue,
	ImageNode,
	LayoutBoxNode,
	LayoutNode,
	LayoutTextNode,
	RepeatNode,
	RichTextNode,
	RowNode,
	StyleProps,
	Value,
} from "./document-template";

const id = () => crypto.randomUUID();

export function fixed<T>(value: T): FixedValue<T> {
	return { kind: "fixed", value };
}

export function bind(key: string): BoundValue {
	return { kind: "bind", key };
}

export function row(
	children: LayoutNode[],
	options?: {
		style?: StyleProps;
		gap?: number;
	},
): RowNode {
	return {
		id: id(),
		kind: "row",
		children,
		style: options?.style,
		gap: options?.gap,
	};
}

export function column(
	columns: LayoutBoxNode[],
	options?: {
		style?: StyleProps;
		gap?: number;
	},
): ColumnNode {
	return {
		id: id(),
		kind: "column",
		columns,
		style: options?.style,
		gap: options?.gap,
	};
}

export function box(
	children: LayoutNode[],
	options?: {
		style?: StyleProps;
		unbreakable?: boolean;
	},
): LayoutBoxNode {
	return {
		id: id(),
		kind: "box",
		style: options?.style,
		unbreakable: options?.unbreakable,
		children,
	};
}

export function text(
	src: Value<string>,
	options?: {
		style?: StyleProps;
	},
): LayoutTextNode {
	return {
		id: id(),
		kind: "text",
		src,
		style: options?.style,
	};
}

export function richText(
	src: Value<string>,
	options?: {
		style?: StyleProps;
	},
): RichTextNode {
	return {
		id: id(),
		kind: "rich-text",
		src,
		style: options?.style,
	};
}

export function image(
	src: Value<string>,
	options?: {
		alt?: Value<string>;
		style?: StyleProps;
	},
): ImageNode {
	return {
		id: id(),
		kind: "image",
		src,
		style: options?.style,
	};
}

export function repeat(
	source: string,
	children: LayoutNode[],
	options?: {
		breakable?: boolean;
	},
): RepeatNode {
	return {
		id: id(),
		kind: "repeat",
		source,
		children,
		breakable: options?.breakable,
	};
}

export function conditional(condition: BoundValue, children: LayoutNode[]): ConditionalNode {
	return {
		id: id(),
		kind: "conditional",
		condition,
		children,
	};
}
