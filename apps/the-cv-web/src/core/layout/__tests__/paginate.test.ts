import { describe, expect, it } from "vitest";
import type { SpaceBox } from "@/core/render/render-tree";
import type { BlockBoxNode, FlexColumnBoxNode, ImageBoxNode, TextBoxNode } from "../box-tree-types";
import type { ContentRect, Fragment, FragmentBlockContent, FragmentTextContent } from "../fragment-tree";
import { paginate } from "../paginate";

/** Uniform space on all sides (for tests). */
function box(n: number): SpaceBox {
	return { top: n, right: n, bottom: n, left: n };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A4-ish content rect: 100 px wide, 200 px tall, origin at (10, 10). */
const RECT: ContentRect = {
	contentTop: 10,
	contentLeft: 10,
	contentWidth: 100,
	contentHeight: 200,
	pageWidthPx: 120,
	pageHeightPx: 220,
};

let _idCounter = 0;
function uid() {
	return `n${++_idCounter}`;
}

function makeText(
	height: number,
	{
		lineHeight = 20,
		margin = 0,
		padding = 0,
		unbreakable = false,
	}: { lineHeight?: number; margin?: number; padding?: number; unbreakable?: boolean } = {},
): TextBoxNode {
	const lineCount = Math.max(1, Math.ceil(height / lineHeight));
	return {
		id: uid(),
		kind: "block",
		contentType: "text",
		style: { margin: box(margin), padding: box(padding) },
		constraints: { maxWidth: 100 },
		size: { width: 100, height },
		text: { content: "Sample text", lineHeight, lineCount },
		unbreakable,
	};
}

function makeImage(height: number, { margin = 0 }: { margin?: number } = {}): ImageBoxNode {
	return {
		id: uid(),
		kind: "block",
		contentType: "image",
		style: { margin: box(margin) },
		constraints: { maxWidth: 100 },
		size: { width: 100, height },
		src: "img.png",
		alt: "image",
		unbreakable: false,
	};
}

function makeBlock(
	children: TextBoxNode[] | ImageBoxNode[],
	opts: { padding?: number; margin?: number; unbreakable?: boolean } = {},
): BlockBoxNode {
	const { padding = 0, margin = 0, unbreakable = false } = opts;
	const totalChildHeight = children.reduce((s, c) => s + c.size.height, 0);
	const p = box(padding);
	return {
		id: uid(),
		kind: "block",
		contentType: "container",
		style: { padding: p, margin: box(margin) },
		constraints: { maxWidth: 100 },
		size: { width: 100, height: totalChildHeight + p.top + p.bottom },
		children,
		unbreakable,
	};
}

function makeColumn(children: TextBoxNode[], opts: { gap?: number; padding?: number } = {}): FlexColumnBoxNode {
	const { gap = 0, padding = 0 } = opts;
	const p = box(padding);
	const totalChildHeight = children.reduce((s, c) => s + c.size.height, 0) + gap * Math.max(0, children.length - 1);
	return {
		id: uid(),
		kind: "flex-column",
		contentType: "container",
		style: { padding: p },
		gap,
		constraints: { maxWidth: 100 },
		size: { width: 100, height: totalChildHeight + p.top + p.bottom },
		children,
		unbreakable: false,
	};
}

/** Walk all fragments recursively in a PageFragment. */
function allFragments(page: { fragments: Fragment[] }): Fragment[] {
	const result: Fragment[] = [];
	function walk(frags: Fragment[]) {
		for (const f of frags) {
			result.push(f);
			if (f.content.kind === "block") {
				walk((f.content as FragmentBlockContent).children);
			}
		}
	}
	walk(page.fragments);
	return result;
}

// ---------------------------------------------------------------------------
// Tests: getContentRect util (smoke-test the rect helper we use in tests)
// ---------------------------------------------------------------------------

describe("paginate – single page, content fits", () => {
	it("produces exactly one page for a small text node", () => {
		_idCounter = 0;
		const node = makeText(50); // 50 px < 200 px available
		const pages = paginate(node, RECT);

		expect(pages).toHaveLength(1);
		expect(pages[0].pageIndex).toBe(0);
	});

	it("places the text fragment at contentTop y position", () => {
		_idCounter = 0;
		const node = makeText(50);
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const textFrag = frags.find((f) => f.content.kind === "text");
		expect(textFrag).toBeDefined();
		expect(textFrag?.y).toBe(RECT.contentTop);
	});

	it("fragment width matches node width", () => {
		_idCounter = 0;
		const node = makeText(50);
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const textFrag = frags.find((f) => f.content.kind === "text");
		expect(textFrag?.width).toBe(100);
	});

	it("text fragment has lineStart=0 and full lineCount", () => {
		_idCounter = 0;
		const node = makeText(40, { lineHeight: 20 }); // 2 lines
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const textFrag = frags.find((f) => f.content.kind === "text");
		const content = textFrag?.content as FragmentTextContent;
		expect(content.lineStart).toBe(0);
		expect(content.lineCount).toBe(2);
		expect(textFrag?.nextFragmentId).toBeNull();
	});

	it("image node produces one fragment on one page", () => {
		_idCounter = 0;
		const node = makeImage(80);
		const pages = paginate(node, RECT);

		expect(pages).toHaveLength(1);
		const frags = allFragments(pages[0]);
		const imgFrag = frags.find((f) => f.content.kind === "image");
		expect(imgFrag).toBeDefined();
		expect(imgFrag?.y).toBe(RECT.contentTop);
		expect(imgFrag?.height).toBe(80);
	});
});

// ---------------------------------------------------------------------------
// Tests: text split across two pages
// ---------------------------------------------------------------------------

describe("paginate – text split across pages", () => {
	it("produces two pages when text height exceeds contentHeight", () => {
		_idCounter = 0;
		// lineHeight=20, 15 lines = 300 px, but page only holds 200 px (10 lines)
		const node = makeText(300, { lineHeight: 20 });
		const pages = paginate(node, RECT);

		expect(pages).toHaveLength(2);
	});

	it("first page fragment covers lines that fit", () => {
		_idCounter = 0;
		// lineHeight=20, available=200, so 10 lines fit
		const node = makeText(300, { lineHeight: 20 }); // 15 lines
		const pages = paginate(node, RECT);

		const frags0 = allFragments(pages[0]);
		const textFrag0 = frags0.find((f) => f.content.kind === "text");
		expect(textFrag0).toBeDefined();
		const content0 = (textFrag0 as NonNullable<typeof textFrag0>).content as FragmentTextContent;

		expect(content0.lineStart).toBe(0);
		expect(content0.lineCount).toBe(10); // floor(200 / 20)
	});

	it("second page fragment continues from where first left off", () => {
		_idCounter = 0;
		const node = makeText(300, { lineHeight: 20 }); // 15 lines
		const pages = paginate(node, RECT);

		const frags1 = allFragments(pages[1]);
		const textFrag1 = frags1.find((f) => f.content.kind === "text");
		expect(textFrag1).toBeDefined();
		const content1 = (textFrag1 as NonNullable<typeof textFrag1>).content as FragmentTextContent;

		expect(content1.lineStart).toBe(10);
		expect(content1.lineCount).toBe(5); // remaining 5 lines
	});

	it("first fragment links to second via nextFragmentId", () => {
		_idCounter = 0;
		const node = makeText(300, { lineHeight: 20 });
		const pages = paginate(node, RECT);

		const frags0 = allFragments(pages[0]);
		const frags1 = allFragments(pages[1]);
		const frag0 = frags0.find((f) => f.content.kind === "text");
		const frag1 = frags1.find((f) => f.content.kind === "text");
		expect(frag0).toBeDefined();
		expect(frag1).toBeDefined();
		expect((frag0 as NonNullable<typeof frag0>).nextFragmentId).toBe((frag1 as NonNullable<typeof frag1>).id);
	});

	it("second page fragment starts at contentTop", () => {
		_idCounter = 0;
		const node = makeText(300, { lineHeight: 20 });
		const pages = paginate(node, RECT);

		const frags1 = allFragments(pages[1]);
		const textFrag1 = frags1.find((f) => f.content.kind === "text");
		expect(textFrag1).toBeDefined();
		expect((textFrag1 as NonNullable<typeof textFrag1>).y).toBe(RECT.contentTop);
	});
});

// ---------------------------------------------------------------------------
// Tests: unbreakable node
// ---------------------------------------------------------------------------

describe("paginate – unbreakable node", () => {
	it("fits on page 1 when there is enough remaining height", () => {
		_idCounter = 0;
		// First node takes 50 px, then unbreakable node is 100 px (150 px total, fits in 200 px)
		const first = makeText(50);
		const unbreakable = makeText(100, { unbreakable: true });
		const root = makeBlock([first, unbreakable] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		expect(pages).toHaveLength(1);
	});

	it("moves to next page when it does not fit in remaining height", () => {
		_idCounter = 0;
		// First node takes 160 px, leaving 40 px; unbreakable node is 80 px → should move to page 2
		const first = makeText(160);
		const unbreakable = makeText(80, { unbreakable: true });
		const root = makeBlock([first, unbreakable] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		expect(pages).toHaveLength(2);
	});

	it("unbreakable node appears as the first fragment on page 2", () => {
		_idCounter = 0;
		const first = makeText(160);
		const unbreakable = makeText(80, { unbreakable: true });
		const root = makeBlock([first, unbreakable] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		const frags1 = allFragments(pages[1]);
		const textFrag = frags1.find((f) => f.content.kind === "text");
		// The unbreakable node should be at contentTop of page 2
		expect(textFrag?.y).toBe(RECT.contentTop);
	});
});

// ---------------------------------------------------------------------------
// Tests: container (block)
// ---------------------------------------------------------------------------

describe("paginate – container node", () => {
	it("empty container emits a block fragment with no children", () => {
		_idCounter = 0;
		const root: BlockBoxNode = {
			id: uid(),
			kind: "block",
			contentType: "container",
			style: {},
			constraints: { maxWidth: 100 },
			size: { width: 100, height: 0 },
			children: [],
			unbreakable: false,
		};
		const pages = paginate(root, RECT);

		expect(pages).toHaveLength(1);
		const frag = pages[0].fragments[0];
		expect(frag.content.kind).toBe("block");
		expect((frag.content as FragmentBlockContent).children).toHaveLength(0);
	});

	it("container with two text children produces block fragment wrapping both", () => {
		_idCounter = 0;
		const text1 = makeText(40);
		const text2 = makeText(60);
		const root = makeBlock([text1, text2] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		expect(pages).toHaveLength(1);
		const topFrag = pages[0].fragments[0];
		expect(topFrag.content.kind).toBe("block");
		const blockContent = topFrag.content as FragmentBlockContent;
		// Both children should be wrapped inside the block fragment
		expect(blockContent.children).toHaveLength(2);
	});

	it("container block fragment height spans from first to last child", () => {
		_idCounter = 0;
		const text1 = makeText(40);
		const text2 = makeText(60);
		const root = makeBlock([text1, text2] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		const topFrag = pages[0].fragments[0];
		// Block fragment height = sum of children heights = 40 + 60 = 100
		expect(topFrag.height).toBe(100);
	});

	it("container block fragment x is at contentLeft, not contentLeft + padding", () => {
		_idCounter = 0;
		const text1 = makeText(40, { padding: 0 });
		const root = makeBlock([text1] as TextBoxNode[], { padding: 10 });
		const pages = paginate(root, RECT);

		const topFrag = pages[0].fragments[0];
		// The container block fragment should be at contentLeft (outer x), not contentLeft + padding
		expect(topFrag.x).toBe(RECT.contentLeft);
	});
});

// ---------------------------------------------------------------------------
// Tests: margin handling
// ---------------------------------------------------------------------------

describe("paginate – margin handling", () => {
	it("text with margin: height emitted includes margin on both sides", () => {
		_idCounter = 0;
		const node = makeText(40, { margin: 5 }); // total = 40 + 2*5 = 50
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const textFrag = frags.find((f) => f.content.kind === "text");
		expect(textFrag?.height).toBe(50); // 40 + 2*5
	});

	it("text fits check accounts for margin (totalHeightWithMargin <= remainingHeight)", () => {
		_idCounter = 0;
		// size.height = 196 px, margin = 4 px, total = 196 + 2*4 = 204 px > 200 px available
		// A buggy implementation would check only size.height (196 <= 200 = fits) but it should NOT fit
		const node = makeText(196, { margin: 4, lineHeight: 20 }); // 204 px total with margin
		const pages = paginate(node, RECT);

		// Should split to 2 pages because 204 > 200
		expect(pages).toHaveLength(2);
	});
});

describe("paginate – fragment position", () => {
	it("node with position absolute produces fragment with position absolute", () => {
		_idCounter = 0;
		const node = makeText(50);
		node.style = { ...node.style, position: "absolute" };
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const textFrag = frags.find((f) => f.content.kind === "text");
		expect(textFrag?.position).toBe("absolute");
	});

	it("node without position produces fragment with position flow", () => {
		_idCounter = 0;
		const node = makeText(50);
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const textFrag = frags.find((f) => f.content.kind === "text");
		expect(textFrag?.position).toBe("flow");
	});
});

describe("paginate – container margin", () => {
	it("container with margin reserves space so first child y is below margin", () => {
		_idCounter = 0;
		const text1 = makeText(30);
		const root = makeBlock([text1] as TextBoxNode[], { margin: 10 });
		const pages = paginate(root, RECT);

		const frags = allFragments(pages[0]);
		const blockFrag = frags.find((f) => f.content.kind === "block");
		const textFrag =
			blockFrag && (blockFrag.content as FragmentBlockContent).children.find((f) => f.content.kind === "text");
		expect(blockFrag).toBeDefined();
		expect(textFrag).toBeDefined();
		// First child should start at contentTop + margin (10)
		expect(textFrag?.y).toBe(RECT.contentTop + 10);
	});
});

describe("paginate – image margin", () => {
	it("image fragment height includes margin on both sides", () => {
		_idCounter = 0;
		const node = makeImage(60, { margin: 6 }); // 60 + 2*6 = 72
		const pages = paginate(node, RECT);

		const frags = allFragments(pages[0]);
		const imgFrag = frags.find((f) => f.content.kind === "image");
		expect(imgFrag?.height).toBe(72);
	});
});

describe("paginate – flex-column container", () => {
	it("flex-column with children paginates like block (vertical stack)", () => {
		_idCounter = 0;
		const text1 = makeText(40);
		const text2 = makeText(40);
		const root = makeColumn([text1, text2]);
		const pages = paginate(root, RECT);

		expect(pages).toHaveLength(1);
		const frags = allFragments(pages[0]);
		const blockFrag = frags.find((f) => f.content.kind === "block");
		expect(blockFrag).toBeDefined();
		const blockContent = (blockFrag as NonNullable<typeof blockFrag>).content as FragmentBlockContent;
		expect(blockContent.children).toHaveLength(2);
	});
});

// ---------------------------------------------------------------------------
// Tests: multiple siblings
// ---------------------------------------------------------------------------

describe("paginate – multiple sibling nodes", () => {
	it("two text nodes on same page: second starts below first", () => {
		_idCounter = 0;
		const text1 = makeText(60);
		const text2 = makeText(40);
		const root = makeBlock([text1, text2] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		const frags = allFragments(pages[0]);
		const textFrags = frags.filter((f) => f.content.kind === "text");
		textFrags.sort((a, b) => a.y - b.y);

		expect(textFrags[0].y).toBe(RECT.contentTop);
		expect(textFrags[1].y).toBe(RECT.contentTop + 60);
	});

	it("three text nodes: third overflows to page 2", () => {
		_idCounter = 0;
		const text1 = makeText(80);
		const text2 = makeText(80);
		const text3 = makeText(80); // cumulative = 240 > 200
		const root = makeBlock([text1, text2, text3] as TextBoxNode[]);
		const pages = paginate(root, RECT);

		expect(pages.length).toBeGreaterThanOrEqual(2);
	});
});

// ---------------------------------------------------------------------------
// Tests: page metadata
// ---------------------------------------------------------------------------

describe("paginate – page metadata", () => {
	it("page fragment carries correct content dimensions from rect", () => {
		_idCounter = 0;
		const node = makeText(50);
		const pages = paginate(node, RECT);

		expect(pages[0].contentWidth).toBe(RECT.contentWidth);
		expect(pages[0].contentHeight).toBe(RECT.contentHeight);
		expect(pages[0].pageWidthPx).toBe(RECT.pageWidthPx);
		expect(pages[0].pageHeightPx).toBe(RECT.pageHeightPx);
	});

	it("page fragment carries contentTop and contentLeft so preview can show page padding", () => {
		_idCounter = 0;
		const node = makeText(50);
		const pages = paginate(node, RECT);

		expect(pages[0].contentTop).toBe(RECT.contentTop);
		expect(pages[0].contentLeft).toBe(RECT.contentLeft);
		// Second page should have same content offset
		if (pages.length > 1) {
			expect(pages[1].contentTop).toBe(RECT.contentTop);
			expect(pages[1].contentLeft).toBe(RECT.contentLeft);
		}
	});

	it("page indices are sequential starting at 0", () => {
		_idCounter = 0;
		const node = makeText(300, { lineHeight: 20 }); // 2 pages
		const pages = paginate(node, RECT);

		pages.forEach((p, i) => {
			expect(p.pageIndex).toBe(i);
		});
	});
});
