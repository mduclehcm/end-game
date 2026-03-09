import type {
	BoundValue,
	ColumnNode,
	ConditionalNode,
	DesignTokens,
	DocumentTemplate,
	FixedValue,
	ImageNode,
	LayoutBoxNode,
	LayoutNode,
	LayoutTextNode,
	RepeatNode,
	RichTextNode,
	RowNode,
	SpaceValue,
	StyleProps,
	Value,
} from "@/core/document/document-template";
import type { ResolvedStyleProps } from "@/core/render/render-tree";
import { getRepeatIndices } from "./document-view";

// --- Expanded layout tree (no Value<>, no repeat/conditional) -----------------

export interface ExpandedBoxNode {
	id: string;
	kind: "box";
	style: ResolvedStyleProps;
	children: ExpandedLayoutNode[];
	unbreakable?: boolean;
}

export interface ExpandedRowNode {
	id: string;
	kind: "row";
	style: ResolvedStyleProps;
	gap: number;
	children: ExpandedLayoutNode[];
}

export interface ExpandedColumnNode {
	id: string;
	kind: "column";
	style: ResolvedStyleProps;
	gap: number;
	children: ExpandedLayoutNode[];
}

export interface ExpandedTextNode {
	id: string;
	kind: "text";
	content: string;
	style: ResolvedStyleProps;
}

export interface ExpandedRichTextNode {
	id: string;
	kind: "rich-text";
	content: string;
	style: ResolvedStyleProps;
}

export interface ExpandedImageNode {
	id: string;
	kind: "image";
	src: string;
	alt?: string;
	style: ResolvedStyleProps;
}

export type ExpandedLayoutNode =
	| ExpandedBoxNode
	| ExpandedRowNode
	| ExpandedColumnNode
	| ExpandedTextNode
	| ExpandedRichTextNode
	| ExpandedImageNode;

/** Scope when expanding a repeat: resolve bind(source + "." + anyIndex + "." + rest) as document[source + "." + scopeIndex + "." + rest]. */
export interface RepeatScope {
	source: string;
	index: number;
}

// --- Token path resolution ---------------------------------------------------

function getTokenValue(tokens: DesignTokens, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = tokens;
	for (const p of parts) {
		if (current == null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[p];
	}
	return current;
}

function resolveSpaceValue(sv: SpaceValue | undefined): number {
	if (sv == null) return 0;
	if (typeof sv === "number") return sv;
	return sv.top ?? 0;
}

function resolveValue<T>(
	value: Value<T>,
	document: Record<string, string>,
	tokens: DesignTokens,
	scope: RepeatScope | undefined,
): T {
	if (value.kind === "fixed") return (value as FixedValue<T>).value;
	const key = (value as BoundValue).key;
	let resolvedKey = key;
	if (scope && key.startsWith(scope.source + ".")) {
		const rest = key.slice(scope.source.length);
		const match = /^(\d+)\.(.*)$/.exec(rest);
		if (match) {
			resolvedKey = `${scope.source}.${scope.index}.${match[2]}`;
		}
	}
	if (key.startsWith("tokens.")) {
		const v = getTokenValue(tokens, key.slice(7));
		return v as T;
	}
	const docVal = document[resolvedKey];
	if (docVal !== undefined) return docVal as T;
	return "" as T;
}

function resolveStyleProps(
	style: StyleProps | undefined,
	document: Record<string, string>,
	tokens: DesignTokens,
	scope: RepeatScope | undefined,
): ResolvedStyleProps {
	if (!style) return {};
	const out: ResolvedStyleProps = {};
	if (style.position !== undefined) {
		const v = resolveValue(style.position, document, tokens, scope);
		if (v === "absolute" || v === "relative" || v === "static") {
			out.position = v;
		}
	}
	if (style.width !== undefined) {
		const v = resolveValue(style.width as Value<number | string>, document, tokens, scope);
		out.width = typeof v === "number" ? v : v;
	}
	if (style.height !== undefined) {
		const v = resolveValue(style.height as Value<number | string>, document, tokens, scope);
		out.height = typeof v === "number" ? v : v;
	}
	if (style.padding !== undefined) {
		const v = resolveValue(style.padding as Value<SpaceValue>, document, tokens, scope);
		out.padding = resolveSpaceValue(v as SpaceValue);
	}
	if (style.margin !== undefined) {
		const v = resolveValue(style.margin as Value<SpaceValue>, document, tokens, scope);
		out.margin = resolveSpaceValue(v as SpaceValue);
	}
	if (style.gap !== undefined) {
		const v = resolveValue(style.gap as Value<SpaceValue>, document, tokens, scope);
		out.gap = resolveSpaceValue(v as SpaceValue);
	}
	if (style.fontFamily !== undefined) {
		out.fontFamily = resolveValue(style.fontFamily, document, tokens, scope) as string;
	}
	if (style.fontSize !== undefined) {
		const v = resolveValue(style.fontSize, document, tokens, scope);
		out.fontSize = typeof v === "number" ? v : Number(v) || undefined;
	}
	if (style.fontWeight !== undefined) {
		const v = resolveValue(style.fontWeight as Value<number | string>, document, tokens, scope);
		out.fontWeight = typeof v === "number" ? v : v === "bold" ? 700 : undefined;
	}
	if (style.fontStyle !== undefined) {
		out.fontStyle = resolveValue(style.fontStyle, document, tokens, scope) as ResolvedStyleProps["fontStyle"];
	}
	if (style.lineHeight !== undefined) {
		const v = resolveValue(style.lineHeight, document, tokens, scope);
		out.lineHeight = typeof v === "number" ? v : Number(v) || undefined;
	}
	if (style.textAlign !== undefined) {
		out.textAlign = resolveValue(style.textAlign, document, tokens, scope) as ResolvedStyleProps["textAlign"];
	}
	if (style.textTransform !== undefined) {
		out.textTransform = resolveValue(
			style.textTransform,
			document,
			tokens,
			scope,
		) as ResolvedStyleProps["textTransform"];
	}
	if (style.color !== undefined) {
		out.color = resolveValue(style.color, document, tokens, scope) as string;
	}
	if (style.backgroundColor !== undefined) {
		out.backgroundColor = resolveValue(style.backgroundColor, document, tokens, scope) as string;
	}
	if (style.borderColor !== undefined) {
		out.borderColor = resolveValue(style.borderColor, document, tokens, scope) as string;
	}
	if (style.borderWidth !== undefined) {
		const v = resolveValue(style.borderWidth, document, tokens, scope);
		out.borderWidth = typeof v === "number" ? v : Number(v) || undefined;
	}
	if (style.borderRadius !== undefined) {
		const v = resolveValue(style.borderRadius, document, tokens, scope);
		out.borderRadius = typeof v === "number" ? v : Number(v) || undefined;
	}
	return out;
}

let expandedIdCounter = 0;
function nextExpandedId(): string {
	return `exp-${++expandedIdCounter}`;
}

function expandNode(
	node: LayoutNode,
	document: Record<string, string>,
	template: DocumentTemplate,
	scope: RepeatScope | undefined,
): ExpandedLayoutNode[] {
	const tokens = template.tokens;
	const resolve = <T>(v: Value<T>) => resolveValue(v, document, tokens, scope);
	const resolveStyle = (s?: StyleProps) => resolveStyleProps(s, document, tokens, scope);

	switch (node.kind) {
		case "conditional": {
			const cond = resolve((node as ConditionalNode).condition);
			const truthy = cond !== undefined && cond !== null && cond !== "" && cond !== false;
			if (!truthy) return [];
			return (node as ConditionalNode).children.flatMap((child) => expandNode(child, document, template, scope));
		}
		case "repeat": {
			const r = node as RepeatNode;
			const indices = getRepeatIndices(document, r.source);
			const result: ExpandedLayoutNode[] = [];
			for (const index of indices) {
				const childScope: RepeatScope = { source: r.source, index };
				for (const child of r.children) {
					result.push(...expandNode(child, document, template, childScope));
				}
			}
			return result;
		}
		case "box": {
			const b = node as LayoutBoxNode;
			const children = b.children.flatMap((c) => expandNode(c, document, template, scope));
			const style = resolveStyle(b.style) ?? {};
			return [
				{
					id: nextExpandedId(),
					kind: "box",
					style,
					children,
					unbreakable: b.unbreakable,
				},
			];
		}
		case "row": {
			const row = node as RowNode;
			const children = row.children.flatMap((c) => expandNode(c, document, template, scope));
			const style = resolveStyle(row.style) ?? {};
			const gap = typeof row.gap === "number" ? row.gap : (resolveStyle(row.style)?.gap ?? 0);
			return [
				{
					id: nextExpandedId(),
					kind: "row",
					style,
					gap: typeof gap === "number" ? gap : 0,
					children,
				},
			];
		}
		case "column": {
			const col = node as ColumnNode;
			const children = col.columns.flatMap((c) => expandNode(c, document, template, scope));
			const style = resolveStyle(col.style) ?? {};
			const gap = typeof col.gap === "number" ? col.gap : (resolveStyle(col.style)?.gap ?? 0);
			return [
				{
					id: nextExpandedId(),
					kind: "column",
					style,
					gap: typeof gap === "number" ? gap : 0,
					children,
				},
			];
		}
		case "text": {
			const t = node as LayoutTextNode;
			const content = resolve(t.src);
			const style = resolveStyle(t.style) ?? {};
			return [
				{
					id: nextExpandedId(),
					kind: "text",
					content: String(content ?? ""),
					style,
				},
			];
		}
		case "rich-text": {
			const rt = node as RichTextNode;
			const content = resolve(rt.src);
			const style = resolveStyle(rt.style) ?? {};
			return [
				{
					id: nextExpandedId(),
					kind: "rich-text",
					content: String(content ?? ""),
					style,
				},
			];
		}
		case "image": {
			const img = node as ImageNode;
			const src = resolve(img.src);
			const style = resolveStyle(img.style) ?? {};
			return [
				{
					id: nextExpandedId(),
					kind: "image",
					src: String(src ?? ""),
					style,
				},
			];
		}
		default: {
			const _exhaust: never = node;
			void _exhaust;
			return [];
		}
	}
}

/**
 * Expand layout tree: resolve all values, expand repeat and conditional.
 * Returns a single root (wrapping multiple roots in a box if needed) or null if empty.
 */
export function expandLayoutTree(
	layout: LayoutNode,
	document: Record<string, string>,
	template: DocumentTemplate,
): ExpandedLayoutNode | null {
	expandedIdCounter = 0;
	const nodes = expandNode(layout, document, template, undefined);
	if (nodes.length === 0) return null;
	if (nodes.length === 1) return nodes[0];
	return {
		id: nextExpandedId(),
		kind: "box",
		style: {},
		children: nodes,
	};
}
