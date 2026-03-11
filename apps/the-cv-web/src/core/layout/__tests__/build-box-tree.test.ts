import { describe, expect, it } from "vitest";
import type { SpaceBox } from "@/core/render/render-tree";
import type { BlockBoxNode, FlexColumnBoxNode, FlexRowBoxNode, ImageBoxNode, TextBoxNode } from "../box-tree-types";
import { buildBoxTree } from "../build-box-tree";
import type {
	ExpandedBoxNode,
	ExpandedColumnNode,
	ExpandedImageNode,
	ExpandedRowNode,
	ExpandedTextNode,
} from "../expand-layout";

/** Uniform padding (for tests). */
function box(n: number): SpaceBox {
	return { top: n, right: n, bottom: n, left: n };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _id = 0;
function uid() {
	return `n${++_id}`;
}

function textNode(content = "hello"): ExpandedTextNode {
	return { id: uid(), kind: "text", content, style: {} };
}

function richTextNode(content = "<b>bold</b>"): { id: string; kind: "rich-text"; content: string; style: object } {
	return { id: uid(), kind: "rich-text", content, style: {} };
}

function imageNode(src = "photo.png"): ExpandedImageNode {
	return { id: uid(), kind: "image", src, style: {} };
}

function boxNode(children: ExpandedBoxNode["children"] = [], unbreakable = false): ExpandedBoxNode {
	return { id: uid(), kind: "box", style: {}, children, unbreakable };
}

function rowNode(children: ExpandedRowNode["children"] = [], gap = 0): ExpandedRowNode {
	return { id: uid(), kind: "row", style: {}, gap, children };
}

function columnNode(children: ExpandedColumnNode["children"] = [], gap = 0): ExpandedColumnNode {
	return { id: uid(), kind: "column", style: {}, gap, children };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildBoxTree – null input", () => {
	it("returns null for null expanded node", () => {
		expect(buildBoxTree(null, 800)).toBeNull();
	});
});

describe("buildBoxTree – text node", () => {
	it("maps text → TextBoxNode with kind=block, contentType=text", () => {
		_id = 0;
		const node = buildBoxTree(textNode(), 800);
		expect(node).not.toBeNull();
		expect(node?.kind).toBe("block");
		expect(node?.contentType).toBe("text");
	});

	it("text node size starts at zero (measurement not yet done)", () => {
		_id = 0;
		const node = buildBoxTree(textNode(), 800) as TextBoxNode;
		expect(node.size.width).toBe(0);
		expect(node.size.height).toBe(0);
	});

	it("text node constraint maxWidth equals contentWidth", () => {
		_id = 0;
		const node = buildBoxTree(textNode(), 800) as TextBoxNode;
		expect(node.constraints.maxWidth).toBe(800);
	});

	it("text node carries the content string", () => {
		_id = 0;
		const node = buildBoxTree(textNode("My resume"), 800) as TextBoxNode;
		expect(node.text.content).toBe("My resume");
	});

	it("text node lineHeight defaults when not in style", () => {
		_id = 0;
		const node = buildBoxTree(textNode(), 800) as TextBoxNode;
		// fontSize not set → fallback lineHeight = 16
		expect(node.text.lineHeight).toBe(16);
	});

	it("text node lineHeight is derived from fontSize when lineHeight not set", () => {
		_id = 0;
		const expanded: ExpandedTextNode = { id: uid(), kind: "text", content: "hi", style: { fontSize: 20 } };
		const node = buildBoxTree(expanded, 800) as TextBoxNode;
		expect(node.text.lineHeight).toBe(24); // 20 * 1.2
	});

	it("text node lineHeight uses style.lineHeight when provided", () => {
		_id = 0;
		const expanded: ExpandedTextNode = { id: uid(), kind: "text", content: "hi", style: { lineHeight: 30 } };
		const node = buildBoxTree(expanded, 800) as TextBoxNode;
		expect(node.text.lineHeight).toBe(30);
	});

	it("rich-text node gets isHtml=true on TextRun", () => {
		_id = 0;
		const node = buildBoxTree(richTextNode(), 800) as TextBoxNode;
		expect(node.text.isHtml).toBe(true);
	});

	it("text node is not unbreakable by default", () => {
		_id = 0;
		const node = buildBoxTree(textNode(), 800) as TextBoxNode;
		expect(node.unbreakable).toBeFalsy();
	});
});

describe("buildBoxTree – image node", () => {
	it("maps image → ImageBoxNode with contentType=image", () => {
		_id = 0;
		const node = buildBoxTree(imageNode(), 800) as ImageBoxNode;
		expect(node.contentType).toBe("image");
		expect(node.src).toBe("photo.png");
	});

	it("image node size starts at zero", () => {
		_id = 0;
		const node = buildBoxTree(imageNode(), 800) as ImageBoxNode;
		expect(node.size.width).toBe(0);
		expect(node.size.height).toBe(0);
	});

	it("image constraint maxWidth equals contentWidth", () => {
		_id = 0;
		const node = buildBoxTree(imageNode(), 800) as ImageBoxNode;
		expect(node.constraints.maxWidth).toBe(800);
	});

	it("image node preserves alt when provided", () => {
		_id = 0;
		const expanded: ExpandedImageNode = { id: uid(), kind: "image", src: "photo.png", alt: "Profile photo", style: {} };
		const node = buildBoxTree(expanded, 800) as ImageBoxNode;
		expect(node.alt).toBe("Profile photo");
	});
});

describe("buildBoxTree – box (block) node", () => {
	it("maps box → BlockBoxNode with kind=block, contentType=container", () => {
		_id = 0;
		const node = buildBoxTree(boxNode(), 800) as BlockBoxNode;
		expect(node.kind).toBe("block");
		expect(node.contentType).toBe("container");
	});

	it("box children are recursively built", () => {
		_id = 0;
		const node = buildBoxTree(boxNode([textNode(), textNode()]), 800) as BlockBoxNode;
		expect(node.children).toHaveLength(2);
		expect(node.children[0].contentType).toBe("text");
	});

	it("box padding reduces children maxWidth constraint", () => {
		_id = 0;
		const expanded: ExpandedBoxNode = {
			id: uid(),
			kind: "box",
			style: { padding: box(10) },
			children: [textNode()],
		};
		const node = buildBoxTree(expanded, 800) as BlockBoxNode;
		// children get maxWidth = 800 - 10 - 10 = 780
		expect((node.children[0] as TextBoxNode).constraints.maxWidth).toBe(780);
	});

	it("box with unbreakable=true preserves flag", () => {
		_id = 0;
		const node = buildBoxTree(boxNode([], true), 800) as BlockBoxNode;
		expect(node.unbreakable).toBe(true);
	});
});

describe("buildBoxTree – row node", () => {
	it("maps row → FlexRowBoxNode with kind=flex-row", () => {
		_id = 0;
		const node = buildBoxTree(rowNode([textNode(), textNode()]), 800) as FlexRowBoxNode;
		expect(node.kind).toBe("flex-row");
		expect(node.contentType).toBe("container");
	});

	it("row preserves gap value", () => {
		_id = 0;
		const node = buildBoxTree(rowNode([textNode()], 16), 800) as FlexRowBoxNode;
		expect(node.gap).toBe(16);
	});

	it("row is unbreakable by default", () => {
		_id = 0;
		const node = buildBoxTree(rowNode([textNode()]), 800) as FlexRowBoxNode;
		expect(node.unbreakable).toBe(true);
	});

	it("row children receive parent contentWidth as maxWidth", () => {
		_id = 0;
		const node = buildBoxTree(rowNode([textNode()]), 500) as FlexRowBoxNode;
		expect((node.children[0] as TextBoxNode).constraints.maxWidth).toBe(500);
	});

	it("row with style.padding reduces children maxWidth", () => {
		_id = 0;
		const expanded: ExpandedRowNode = {
			id: uid(),
			kind: "row",
			style: { padding: box(8) },
			gap: 0,
			children: [textNode()],
		};
		const node = buildBoxTree(expanded, 400) as FlexRowBoxNode;
		// 400 - 8 - 8 = 384
		expect((node.children[0] as TextBoxNode).constraints.maxWidth).toBe(384);
	});
});

describe("buildBoxTree – column node", () => {
	it("maps column → FlexColumnBoxNode with kind=flex-column", () => {
		_id = 0;
		const node = buildBoxTree(columnNode([boxNode([textNode()])]), 800) as FlexColumnBoxNode;
		expect(node.kind).toBe("flex-column");
		expect(node.contentType).toBe("container");
	});

	it("column preserves gap value", () => {
		_id = 0;
		const node = buildBoxTree(columnNode([boxNode()], 12), 800) as FlexColumnBoxNode;
		expect(node.gap).toBe(12);
	});

	it("column is breakable by default (unbreakable=false)", () => {
		_id = 0;
		const node = buildBoxTree(columnNode([boxNode()]), 800) as FlexColumnBoxNode;
		expect(node.unbreakable).toBeFalsy();
	});

	it("column with style.padding reduces children maxWidth", () => {
		_id = 0;
		const expanded: ExpandedColumnNode = {
			id: uid(),
			kind: "column",
			style: { padding: box(12) },
			gap: 0,
			children: [boxNode([textNode()])],
		};
		const node = buildBoxTree(expanded, 600) as FlexColumnBoxNode;
		// 600 - 12 - 12 = 576 for column; inner box has no extra padding
		const innerBox = node.children[0] as BlockBoxNode;
		const leaf = innerBox.children[0] as TextBoxNode;
		expect(leaf.constraints.maxWidth).toBe(576);
	});
});

describe("buildBoxTree – nested structure", () => {
	it("box > row > text: all three levels are built correctly", () => {
		_id = 0;
		const inner = textNode("inner");
		const row = rowNode([inner]);
		const root = boxNode([row]);
		const rootNode = buildBoxTree(root, 800) as BlockBoxNode;

		expect(rootNode.kind).toBe("block");
		const rowNode2 = rootNode.children[0] as FlexRowBoxNode;
		expect(rowNode2.kind).toBe("flex-row");
		const textNode2 = rowNode2.children[0] as TextBoxNode;
		expect(textNode2.text.content).toBe("inner");
	});

	it("nested padding narrows maxWidth at each level", () => {
		_id = 0;
		const outerBox: ExpandedBoxNode = {
			id: uid(),
			kind: "box",
			style: { padding: box(20) },
			children: [
				{
					id: uid(),
					kind: "box",
					style: { padding: box(10) },
					children: [textNode()],
				},
			],
		};
		const root = buildBoxTree(outerBox, 800) as BlockBoxNode;
		// outer inner width = 800 - 2*20 = 760
		// inner inner width = 760 - 2*10 = 740
		const innerBlock = root.children[0] as BlockBoxNode;
		const leaf = innerBlock.children[0] as TextBoxNode;
		expect(leaf.constraints.maxWidth).toBe(740);
	});
});
