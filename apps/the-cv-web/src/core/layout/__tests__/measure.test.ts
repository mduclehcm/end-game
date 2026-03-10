/**
 * Tests for measureBoxTree.
 * measureTextHeight uses real DOM (jsdom), but jsdom returns offsetHeight=0 for all elements.
 * We mock it to return controllable values so we can verify the measurement logic.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpaceBox } from "@/core/render/render-tree";
import type { BlockBoxNode, FlexColumnBoxNode, FlexRowBoxNode, ImageBoxNode, TextBoxNode } from "../box-tree-types";
import { measureBoxTree } from "../measure";

// Mock the DOM utilities module before importing measure
vi.mock("../../../lib/dom-utils", () => ({
	measureTextHeight: vi.fn((_content: string, _width: number, _style: unknown) => 0),
}));

import { measureTextHeight } from "../../../lib/dom-utils";

const mockMeasure = vi.mocked(measureTextHeight);

/** Uniform space (for tests). */
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

function makeTextNode(
	maxWidth: number,
	{ padding = 0, lineHeight = 20 }: { padding?: number; lineHeight?: number } = {},
): TextBoxNode {
	return {
		id: uid(),
		kind: "block",
		contentType: "text",
		style: { padding: box(padding) },
		constraints: { maxWidth },
		size: { width: 0, height: 0 },
		text: { content: "Hello", lineHeight },
		unbreakable: false,
	};
}

function makeBlock(children: TextBoxNode[], opts: { padding?: number; maxWidth?: number } = {}): BlockBoxNode {
	const { padding = 0, maxWidth = 800 } = opts;
	return {
		id: uid(),
		kind: "block",
		contentType: "container",
		style: { padding: box(padding) },
		constraints: { maxWidth },
		size: { width: 0, height: 0 },
		children,
		unbreakable: false,
	};
}

function makeRow(children: TextBoxNode[], { gap = 0, maxWidth = 800 } = {}): FlexRowBoxNode {
	return {
		id: uid(),
		kind: "flex-row",
		contentType: "container",
		style: {},
		gap,
		constraints: { maxWidth },
		size: { width: 0, height: 0 },
		children,
		unbreakable: true,
	};
}

function makeColumn(
	children: TextBoxNode[],
	{ gap = 0, maxWidth = 800, padding = 0 }: { gap?: number; maxWidth?: number; padding?: number } = {},
): FlexColumnBoxNode {
	return {
		id: uid(),
		kind: "flex-column",
		contentType: "container",
		style: { padding: box(padding) },
		gap,
		constraints: { maxWidth },
		size: { width: 0, height: 0 },
		children,
		unbreakable: false,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
	_id = 0;
	mockMeasure.mockReset();
});

describe("measureBoxTree – text node", () => {
	it("calls measureTextHeight with correct width (maxWidth minus 2*padding)", async () => {
		mockMeasure.mockReturnValue(40);

		const node = makeTextNode(200, { padding: 10 });
		await measureBoxTree(node);

		// contentWidth = 200 - 2*10 = 180
		expect(mockMeasure).toHaveBeenCalledWith("Hello", 180, expect.any(Object));
	});

	it("sets node.size.height = measuredHeight + 2*padding", async () => {
		mockMeasure.mockReturnValue(60);

		const node = makeTextNode(200, { padding: 5 });
		await measureBoxTree(node);

		expect(node.size.height).toBe(70); // 60 + 2*5
	});

	it("sets node.size.width = constraints.maxWidth", async () => {
		mockMeasure.mockReturnValue(40);

		const node = makeTextNode(300);
		await measureBoxTree(node);

		expect(node.size.width).toBe(300);
	});

	it("fills text.measuredHeight", async () => {
		mockMeasure.mockReturnValue(50);

		const node = makeTextNode(200);
		await measureBoxTree(node);

		expect(node.text.measuredHeight).toBe(50);
	});

	it("fills text.lineCount = ceil(height / lineHeight)", async () => {
		mockMeasure.mockReturnValue(45); // ceil(45/20) = 3

		const node = makeTextNode(200, { lineHeight: 20 });
		await measureBoxTree(node);

		expect(node.text.lineCount).toBe(3);
	});

	it("lineCount is at least 1 even for zero height", async () => {
		mockMeasure.mockReturnValue(0);

		const node = makeTextNode(200, { lineHeight: 20 });
		await measureBoxTree(node);

		expect(node.text.lineCount).toBe(1);
	});

	it("zero maxWidth results in zero size (no DOM call needed)", async () => {
		const node = makeTextNode(0);
		await measureBoxTree(node);

		expect(mockMeasure).not.toHaveBeenCalled();
		expect(node.size.width).toBe(0);
		expect(node.size.height).toBe(0);
	});
});

describe("measureBoxTree – block container", () => {
	it("block height = sum of children heights + 2*padding", async () => {
		mockMeasure.mockReturnValueOnce(40).mockReturnValueOnce(60);

		const child1 = makeTextNode(800);
		const child2 = makeTextNode(800);
		const block = makeBlock([child1, child2], { padding: 10 });

		await measureBoxTree(block);

		// child1.size.height = 40, child2.size.height = 60
		// block.size.height = 40 + 60 + 2*10 = 120
		expect(block.size.height).toBe(120);
	});

	it("block width = constraints.maxWidth + 2*padding", async () => {
		mockMeasure.mockReturnValue(30);

		const child = makeTextNode(780); // inner
		const block = makeBlock([child], { padding: 10, maxWidth: 800 });

		await measureBoxTree(block);

		// block width = 800 + 2*10 = 820... wait let me re-read the measure code
		// Actually: node.size.width = maxWidth + 2 * padding where maxWidth is from constraints
		// But in the actual code:
		// const maxWidth = node.constraints.maxWidth ?? Math.max(...children.map(c => c.size.width), 0);
		// node.size.width = maxWidth + 2 * padding;
		// So for block with constraints.maxWidth=800, padding=10: width = 800 + 2*10 = 820
		expect(block.size.width).toBe(820);
	});

	it("empty block: height = 2*padding, width = constraints.maxWidth", async () => {
		const block: BlockBoxNode = {
			id: uid(),
			kind: "block",
			contentType: "container",
			style: { padding: box(5) },
			constraints: { maxWidth: 200 },
			size: { width: 0, height: 0 },
			children: [],
			unbreakable: false,
		};

		await measureBoxTree(block);

		expect(block.size.height).toBe(10); // top(5) + bottom(5)
		expect(block.size.width).toBe(200); // constraints.maxWidth
	});
});

describe("measureBoxTree – flex-row container", () => {
	it("row width = sum of children widths + gaps + 2*padding", async () => {
		mockMeasure.mockReturnValueOnce(40).mockReturnValueOnce(60);

		const child1 = makeTextNode(100);
		const child2 = makeTextNode(100);
		const row = makeRow([child1, child2], { gap: 16 });

		await measureBoxTree(row);

		// child1.size.width = 100, child2.size.width = 100
		// row.size.width = 100 + 100 + 1*16 + 2*0 = 216
		expect(row.size.width).toBe(216);
	});

	it("row height = max of children heights + 2*padding", async () => {
		mockMeasure.mockReturnValueOnce(40).mockReturnValueOnce(80);

		const child1 = makeTextNode(100);
		const child2 = makeTextNode(100);
		const row = makeRow([child1, child2]);

		await measureBoxTree(row);

		// max(40, 80) = 80, padding = 0
		expect(row.size.height).toBe(80);
	});

	it("empty row: height = 2*padding, width = constraints.maxWidth", async () => {
		const row: FlexRowBoxNode = {
			id: uid(),
			kind: "flex-row",
			contentType: "container",
			style: { padding: box(4) },
			gap: 0,
			constraints: { maxWidth: 300 },
			size: { width: 0, height: 0 },
			children: [],
			unbreakable: true,
		};
		await measureBoxTree(row);
		expect(row.size.height).toBe(8); // top(4) + bottom(4)
		expect(row.size.width).toBe(300);
	});
});

describe("measureBoxTree – flex-column container", () => {
	it("column height = sum of children heights + gaps + 2*padding", async () => {
		mockMeasure.mockReturnValueOnce(30).mockReturnValueOnce(50);

		const child1 = makeTextNode(200);
		const child2 = makeTextNode(200);
		const col = makeColumn([child1, child2], { gap: 10 });

		await measureBoxTree(col);

		// 30 + 50 + 1*10 + 2*0 = 90
		expect(col.size.height).toBe(90);
	});

	it("column with padding: width = maxWidth + 2*padding, height includes padding", async () => {
		mockMeasure.mockReturnValue(40);
		const child = makeTextNode(200);
		const col = makeColumn([child], { padding: 6, maxWidth: 200 });
		await measureBoxTree(col);
		expect(col.size.width).toBe(212); // 200 + 2*6
		expect(col.size.height).toBe(52); // 40 + 2*6
	});
});

describe("measureBoxTree – image node", () => {
	it("uses cached size when image is in cache", async () => {
		_id = 0;
		const node: ImageBoxNode = {
			id: uid(),
			kind: "block",
			contentType: "image",
			style: {},
			constraints: { maxWidth: 400 },
			size: { width: 0, height: 0 },
			src: "https://example.com/photo.png",
			unbreakable: false,
		};
		const cache = new Map<string, { width: number; height: number }>();
		cache.set("https://example.com/photo.png", { width: 200, height: 150 });
		await measureBoxTree(node, cache);
		expect(node.size.width).toBe(200);
		expect(node.size.height).toBe(150);
	});

	it("empty src results in zero size", async () => {
		_id = 0;
		const node: ImageBoxNode = {
			id: uid(),
			kind: "block",
			contentType: "image",
			style: {},
			constraints: { maxWidth: 400 },
			size: { width: 0, height: 0 },
			src: "",
			unbreakable: false,
		};
		await measureBoxTree(node);
		expect(node.size.width).toBe(0);
		expect(node.size.height).toBe(0);
	});
});

describe("measureBoxTree – measurement ordering", () => {
	it("measures children before containers (post-order)", async () => {
		const calls: string[] = [];
		mockMeasure.mockImplementation((_content, _width, _style) => {
			calls.push(_content as string);
			return 20;
		});

		const child1 = makeTextNode(200);
		child1.text.content = "child1";
		const child2 = makeTextNode(200);
		child2.text.content = "child2";
		const block = makeBlock([child1, child2]);

		await measureBoxTree(block);

		// Children measured before container is computed
		expect(calls).toEqual(["child1", "child2"]);
	});
});
