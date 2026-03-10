import type { ResolvedStyleProps } from "@/core/render/render-tree";

/** Page size in mm (e.g. A4). */
export interface PageSize {
	widthMm: number;
	heightMm: number;
}

/** Margins in px. */
export interface PageMargins {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface PageSettings {
	pageSize: PageSize;
	margins: PageMargins;
	/** DPI for converting mm to px (e.g. 96 for screen, 72 for print). */
	dpi?: number;
}

/** Content rectangle in px (origin at top-left of content area). */
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

/** A4 at 96 DPI. */
export const A4_PAGE: PageSize = { widthMm: 210, heightMm: 297 };

// --- Fragment content (what to render) ---------------------------------------

export interface FragmentTextContent {
	kind: "text";
	/** Full text; use lineStart/lineCount to show a slice (renderer uses height = lineCount * lineHeight, overflow hidden). */
	fullContent: string;
	lineStart: number;
	lineCount: number;
	style: ResolvedStyleProps;
	/** When true, fullContent is HTML and should be rendered with dangerouslySetInnerHTML. */
	isHtml?: boolean;
	/** Document path for bound value (e.g. content.personal.email). Used for active field highlight. */
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
	/** When true, children are laid out horizontally (flex-row direction). */
	isRow?: boolean;
}

export type FragmentContent = FragmentTextContent | FragmentImageContent | FragmentBlockContent;

// --- Fragment (slice on one page) ----------------------------------------------

/** "absolute" = use x,y for positioning; "flow" = use native CSS (block/flex). */
export type FragmentPosition = "absolute" | "flow";

export interface Fragment {
	id: string;
	pageIndex: number;
	/** When "absolute", x,y are used for positioning; when "flow", layout uses native CSS. */
	position: FragmentPosition;
	x: number;
	y: number;
	width: number;
	height: number;
	content: FragmentContent;
	/** Id of the next fragment of the same logical node (continuation on next page). */
	nextFragmentId: string | null;
}

// --- Page (root of fragment subtree) -----------------------------------------

export interface PageFragment {
	pageIndex: number;
	/** Content area offset from page top-left (for renderer padding). */
	contentTop: number;
	contentLeft: number;
	/** Content area size in px (for renderer). */
	contentWidth: number;
	contentHeight: number;
	pageWidthPx: number;
	pageHeightPx: number;
	/** Top-level fragments on this page (positioned relative to content area). */
	fragments: Fragment[];
}

export type FragmentTree = PageFragment[];
