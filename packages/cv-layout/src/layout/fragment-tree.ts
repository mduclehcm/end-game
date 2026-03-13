import type { ResolvedStyleProps } from "../style-types.js";

export interface PageSize {
	widthMm: number;
	heightMm: number;
}

export interface PageMargins {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface PageSettings {
	pageSize: PageSize;
	margins: PageMargins;
	dpi?: number;
}

export interface ContentRect {
	contentTop: number;
	contentLeft: number;
	contentWidth: number;
	contentHeight: number;
	pageWidthPx: number;
	pageHeightPx: number;
}

const MM_TO_IN = 1 / 25.4;

export function getContentRect(settings: PageSettings): ContentRect {
	const dpi = settings.dpi ?? 96;
	const pageWidthPx = (settings.pageSize.widthMm * MM_TO_IN * dpi) | 0;
	const pageHeightPx = (settings.pageSize.heightMm * MM_TO_IN * dpi) | 0;
	const m = settings.margins;
	return {
		contentTop: m.top,
		contentLeft: m.left,
		contentWidth: pageWidthPx - m.left - m.right,
		contentHeight: pageHeightPx - m.top - m.bottom,
		pageWidthPx,
		pageHeightPx,
	};
}

export const A4_PAGE: PageSize = { widthMm: 210, heightMm: 297 };

export interface FragmentTextContent {
	kind: "text";
	fullContent: string;
	lineStart: number;
	lineCount: number;
	style: ResolvedStyleProps;
	isHtml?: boolean;
	dataKey?: string;
}

export interface FragmentImageContent {
	kind: "image";
	src: string;
	alt?: string;
	style: ResolvedStyleProps;
	dataKey?: string;
}

export interface FragmentBlockContent {
	kind: "block";
	children: Fragment[];
	isRow?: boolean;
}

export type FragmentContent = FragmentTextContent | FragmentImageContent | FragmentBlockContent;

export type FragmentPosition = "absolute" | "flow";

export interface Fragment {
	id: string;
	pageIndex: number;
	position: FragmentPosition;
	x: number;
	y: number;
	width: number;
	height: number;
	content: FragmentContent;
	nextFragmentId: string | null;
}

export interface PageFragment {
	pageIndex: number;
	contentTop: number;
	contentLeft: number;
	contentWidth: number;
	contentHeight: number;
	pageWidthPx: number;
	pageHeightPx: number;
	fragments: Fragment[];
}

export type FragmentTree = PageFragment[];
