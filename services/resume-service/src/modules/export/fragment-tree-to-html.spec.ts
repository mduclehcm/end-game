import type { FragmentTree, PageFragment } from "@algo/cv-layout";
import { fragmentTreeToHtml } from "./fragment-tree-to-html";

describe("fragmentTreeToHtml", () => {
	it("produces HTML with title and page structure", () => {
		const tree: FragmentTree = [
			{
				pageIndex: 0,
				contentTop: 20,
				contentLeft: 20,
				contentWidth: 554,
				contentHeight: 1083,
				pageWidthPx: 594,
				pageHeightPx: 1123,
				fragments: [
					{
						id: "f1",
						pageIndex: 0,
						position: "flow",
						x: 20,
						y: 20,
						width: 200,
						height: 24,
						content: {
							kind: "text",
							fullContent: "Test Title",
							lineStart: 0,
							lineCount: 1,
							style: { fontSize: 24, fontWeight: 700 },
						},
						nextFragmentId: null,
					},
				],
			} as PageFragment,
		];
		const html = fragmentTreeToHtml(tree, { title: "My Resume" });
		expect(html).toContain("<title>My Resume</title>");
		expect(html).toContain("Test Title");
		expect(html).toContain("position:absolute");
		expect(html).toContain("width:594px");
	});
});
