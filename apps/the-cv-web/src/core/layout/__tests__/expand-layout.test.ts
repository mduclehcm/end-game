import { describe, expect, it } from "vitest";
import type {
	ConditionalNode,
	DesignTokens,
	DocumentTemplate,
	LayoutBoxNode,
	RepeatNode,
} from "../../document/document-template";
import type {
	ExpandedBoxNode,
	ExpandedColumnNode,
	ExpandedImageNode,
	ExpandedRichTextNode,
	ExpandedRowNode,
	ExpandedTextNode,
} from "../expand-layout";
import { expandLayoutTree } from "../expand-layout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKENS: DesignTokens = {
	colors: { primary: "#000" },
	spaces: {
		small: 8,
		page: { padding: 16 },
	},
	fonts: { body: 14 },
};

function makeTemplate(layout: DocumentTemplate["layout"]): DocumentTemplate {
	return { id: "tpl", name: "Test", tokens: TOKENS, layout };
}

function fixed<T>(value: T) {
	return { kind: "fixed" as const, value };
}

function bind(key: string) {
	return { kind: "bind" as const, key };
}

function computed(parts: ({ kind: "fixed"; value: string } | { kind: "bind"; key: string })[]) {
	return { kind: "computed" as const, parts };
}

let _id = 0;
function uid() {
	return `n${++_id}`;
}

// ---------------------------------------------------------------------------
// Tests: fixed values
// ---------------------------------------------------------------------------

describe("expandLayoutTree – text node with fixed value", () => {
	it("returns a single expanded text node", () => {
		_id = 0;
		const template = makeTemplate({ id: uid(), kind: "text", src: fixed("Hello") });
		const result = expandLayoutTree(template.layout, {}, template);

		expect(result).not.toBeNull();
		expect((result as ExpandedTextNode).kind).toBe("text");
		expect((result as ExpandedTextNode).content).toBe("Hello");
	});

	it("empty fixed string produces empty content", () => {
		_id = 0;
		const template = makeTemplate({ id: uid(), kind: "text", src: fixed("") });
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedTextNode;

		expect(result.content).toBe("");
	});
});

// ---------------------------------------------------------------------------
// Tests: bind values resolved from document
// ---------------------------------------------------------------------------

describe("expandLayoutTree – text node with bind value", () => {
	it("resolves bound key from document", () => {
		_id = 0;
		const doc = { "personal.name": "Jane Doe" };
		const template = makeTemplate({ id: uid(), kind: "text", src: bind("personal.name") });
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedTextNode;

		expect(result.content).toBe("Jane Doe");
	});

	it("missing document key resolves to empty string", () => {
		_id = 0;
		const template = makeTemplate({ id: uid(), kind: "text", src: bind("missing.key") });
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedTextNode;

		expect(result.content).toBe("");
	});
});

// ---------------------------------------------------------------------------
// Tests: computed values (concatenate parts)
// ---------------------------------------------------------------------------

describe("expandLayoutTree – text node with computed value", () => {
	it("concatenates fixed and bound parts", () => {
		_id = 0;
		const doc = { "personal.first": "John", "personal.last": "Doe" };
		const template = makeTemplate({
			id: uid(),
			kind: "text",
			src: computed([bind("personal.first"), fixed(" "), bind("personal.last")]),
		});
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedTextNode;

		expect(result.content).toBe("John Doe");
	});

	it("computed with only fixed parts", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "text",
			src: computed([fixed("Hello"), fixed(" "), fixed("World")]),
		});
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedTextNode;

		expect(result.content).toBe("Hello World");
	});
});

// ---------------------------------------------------------------------------
// Tests: box node
// ---------------------------------------------------------------------------

describe("expandLayoutTree – box node", () => {
	it("box with no children expands to expanded box with empty children", () => {
		_id = 0;
		const template = makeTemplate({ id: uid(), kind: "box", children: [] });
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedBoxNode;

		expect(result.kind).toBe("box");
		expect(result.children).toHaveLength(0);
	});

	it("box children are recursively expanded", () => {
		_id = 0;
		const layout: LayoutBoxNode = {
			id: uid(),
			kind: "box",
			children: [
				{ id: uid(), kind: "text", src: fixed("Child 1") },
				{ id: uid(), kind: "text", src: fixed("Child 2") },
			],
		};
		const template = makeTemplate(layout);
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedBoxNode;

		expect(result.children).toHaveLength(2);
		expect((result.children[0] as ExpandedTextNode).content).toBe("Child 1");
		expect((result.children[1] as ExpandedTextNode).content).toBe("Child 2");
	});

	it("box unbreakable flag is preserved", () => {
		_id = 0;
		const layout: LayoutBoxNode = { id: uid(), kind: "box", children: [], unbreakable: true };
		const template = makeTemplate(layout);
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedBoxNode;

		expect(result.unbreakable).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Tests: repeat node
// ---------------------------------------------------------------------------

describe("expandLayoutTree – repeat node", () => {
	it("expands each item in the repeated array", () => {
		_id = 0;
		const doc = {
			"exp.0.title": "Engineer",
			"exp.1.title": "Designer",
		};
		const layout: RepeatNode = {
			id: uid(),
			kind: "repeat",
			source: "exp",
			children: [{ id: uid(), kind: "text", src: bind("exp.0.title") }],
		};
		const template = makeTemplate({ id: uid(), kind: "box", children: [layout] });
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedBoxNode;

		// Two items → two text nodes
		expect(result.children).toHaveLength(2);
	});

	it("each repeated item resolves its own scoped value", () => {
		_id = 0;
		const doc = {
			"jobs.0.company": "Acme",
			"jobs.1.company": "Globex",
		};
		const layout: RepeatNode = {
			id: uid(),
			kind: "repeat",
			source: "jobs",
			children: [{ id: uid(), kind: "text", src: bind("jobs.0.company") }],
		};
		const template = makeTemplate({ id: uid(), kind: "box", children: [layout] });
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedBoxNode;

		expect((result.children[0] as ExpandedTextNode).content).toBe("Acme");
		expect((result.children[1] as ExpandedTextNode).content).toBe("Globex");
	});

	it("empty source (no matching document keys) expands to no children", () => {
		_id = 0;
		const layout: RepeatNode = {
			id: uid(),
			kind: "repeat",
			source: "nothing",
			children: [{ id: uid(), kind: "text", src: fixed("x") }],
		};
		const template = makeTemplate({ id: uid(), kind: "box", children: [layout] });
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedBoxNode;

		expect(result.children).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Tests: conditional node
// ---------------------------------------------------------------------------

describe("expandLayoutTree – conditional node", () => {
	it("includes children when condition key is truthy", () => {
		_id = 0;
		const doc = { "show.section": "yes" };
		const layout: ConditionalNode = {
			id: uid(),
			kind: "conditional",
			condition: bind("show.section"),
			children: [{ id: uid(), kind: "text", src: fixed("Visible") }],
		};
		const template = makeTemplate({ id: uid(), kind: "box", children: [layout] });
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedBoxNode;

		expect(result.children).toHaveLength(1);
		expect((result.children[0] as ExpandedTextNode).content).toBe("Visible");
	});

	it("omits children when condition key is missing (empty string)", () => {
		_id = 0;
		const layout: ConditionalNode = {
			id: uid(),
			kind: "conditional",
			condition: bind("missing.key"),
			children: [{ id: uid(), kind: "text", src: fixed("Hidden") }],
		};
		const template = makeTemplate({ id: uid(), kind: "box", children: [layout] });
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedBoxNode;

		expect(result.children).toHaveLength(0);
	});

	it('omits children when condition value is explicit empty string ""', () => {
		_id = 0;
		const doc = { "show.section": "" };
		const layout: ConditionalNode = {
			id: uid(),
			kind: "conditional",
			condition: bind("show.section"),
			children: [{ id: uid(), kind: "text", src: fixed("Hidden") }],
		};
		const template = makeTemplate({ id: uid(), kind: "box", children: [layout] });
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedBoxNode;

		expect(result.children).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Tests: row and column
// ---------------------------------------------------------------------------

describe("expandLayoutTree – row node", () => {
	it("maps to expanded row with gap and children", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "row",
			gap: 8,
			children: [
				{ id: uid(), kind: "text", src: fixed("A") },
				{ id: uid(), kind: "text", src: fixed("B") },
			],
		});
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedRowNode;

		expect(result.kind).toBe("row");
		expect(result.gap).toBe(8);
		expect(result.children).toHaveLength(2);
	});
});

describe("expandLayoutTree – column node", () => {
	it("maps to expanded column with gap and children", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "column",
			gap: 12,
			columns: [
				{ id: uid(), kind: "box", children: [{ id: uid(), kind: "text", src: fixed("Left") }] },
				{ id: uid(), kind: "box", children: [{ id: uid(), kind: "text", src: fixed("Right") }] },
			],
		});
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedColumnNode;

		expect(result.kind).toBe("column");
		expect(result.gap).toBe(12);
		expect(result.children).toHaveLength(2);
	});
});

// ---------------------------------------------------------------------------
// Tests: multiple root nodes wrapped
// ---------------------------------------------------------------------------

describe("expandLayoutTree – wrapper for multiple roots", () => {
	it("returns null for empty conditional that produces no nodes", () => {
		_id = 0;
		const layout: ConditionalNode = {
			id: uid(),
			kind: "conditional",
			condition: bind("missing"),
			children: [{ id: uid(), kind: "text", src: fixed("x") }],
		};
		const template = makeTemplate(layout);
		const result = expandLayoutTree(template.layout, {}, template);

		expect(result).toBeNull();
	});

	it("single node is returned directly without wrapper", () => {
		_id = 0;
		const template = makeTemplate({ id: uid(), kind: "text", src: fixed("only one") });
		const result = expandLayoutTree(template.layout, {}, template);
		expect(result).not.toBeNull();
		expect((result as ExpandedTextNode).kind).toBe("text");
	});
});

// ---------------------------------------------------------------------------
// Tests: style resolution
// ---------------------------------------------------------------------------

describe("expandLayoutTree – style resolution", () => {
	it("fixed style values are resolved", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "text",
			src: fixed("text"),
			style: { fontSize: fixed(16), color: fixed("#333") },
		});
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedTextNode;

		expect(result.style.fontSize).toBe(16);
		expect(result.style.color).toBe("#333");
	});

	it("bound style values are resolved from document", () => {
		_id = 0;
		const doc = { "style.font": "Arial" };
		const template = makeTemplate({
			id: uid(),
			kind: "text",
			src: fixed("text"),
			style: { fontFamily: bind("style.font") },
		});
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedTextNode;

		expect(result.style.fontFamily).toBe("Arial");
	});

	it("bind with tokens.* resolves from template tokens", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "text",
			src: bind("tokens.fonts.body"),
			style: {},
		});
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedTextNode;
		// TOKENS.fonts.body = 14
		expect(result.content).toBe("14");
	});
});

// ---------------------------------------------------------------------------
// Tests: image and rich-text nodes
// ---------------------------------------------------------------------------

describe("expandLayoutTree – image node", () => {
	it("expands image with fixed src", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "image",
			src: fixed("https://example.com/photo.png"),
		});
		const result = expandLayoutTree(template.layout, {}, template);

		expect(result).not.toBeNull();
		expect((result as ExpandedImageNode).kind).toBe("image");
		expect((result as { kind: "image"; src: string }).src).toBe("https://example.com/photo.png");
	});

	it("expands image with bound src from document", () => {
		_id = 0;
		const doc = { "profile.avatar": "/avatars/me.png" };
		const template = makeTemplate({
			id: uid(),
			kind: "image",
			src: bind("profile.avatar"),
		});
		const result = expandLayoutTree(template.layout, doc, template) as { kind: "image"; src: string };

		expect(result.src).toBe("/avatars/me.png");
	});
});

describe("expandLayoutTree – rich-text node", () => {
	it("expands rich-text with fixed content", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "rich-text",
			src: fixed("<p>Hello <strong>world</strong></p>"),
		});
		const result = expandLayoutTree(template.layout, {}, template);

		expect(result).not.toBeNull();
		expect((result as ExpandedRichTextNode).kind).toBe("rich-text");
		expect((result as { kind: "rich-text"; content: string }).content).toBe("<p>Hello <strong>world</strong></p>");
	});
});

// ---------------------------------------------------------------------------
// Tests: multiple roots wrapped in box
// ---------------------------------------------------------------------------

describe("expandLayoutTree – multiple roots", () => {
	it("when root expands to multiple nodes, wraps them in a single box", () => {
		_id = 0;
		const doc = { show: "yes" };
		const template = makeTemplate({
			id: uid(),
			kind: "conditional",
			condition: bind("show"),
			children: [
				{ id: uid(), kind: "text", src: fixed("A") },
				{ id: uid(), kind: "text", src: fixed("B") },
			],
		});
		const result = expandLayoutTree(template.layout, doc, template) as ExpandedBoxNode;

		expect(result.kind).toBe("box");
		expect(result.children).toHaveLength(2);
		expect((result.children[0] as ExpandedTextNode).content).toBe("A");
		expect((result.children[1] as ExpandedTextNode).content).toBe("B");
	});

	it("box with two children expands to one box with two children", () => {
		_id = 0;
		const template = makeTemplate({
			id: uid(),
			kind: "box",
			children: [
				{ id: uid(), kind: "text", src: fixed("First") },
				{ id: uid(), kind: "text", src: fixed("Second") },
			],
		});
		const result = expandLayoutTree(template.layout, {}, template) as ExpandedBoxNode;

		expect(result.kind).toBe("box");
		expect(result.children).toHaveLength(2);
		expect((result.children[0] as ExpandedTextNode).content).toBe("First");
		expect((result.children[1] as ExpandedTextNode).content).toBe("Second");
	});
});
