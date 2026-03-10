import { describe, expect, it } from "vitest";
import { A4_PAGE, getContentRect } from "../fragment-tree";

describe("getContentRect", () => {
	it("uses default dpi 96 when not provided", () => {
		const rect = getContentRect({
			pageSize: A4_PAGE,
			margins: { top: 0, right: 0, bottom: 0, left: 0 },
		});
		// 210mm at 96 dpi ≈ 793 px, 297mm ≈ 1122 px
		expect(rect.pageWidthPx).toBe(793);
		expect(rect.pageHeightPx).toBe(1122);
		expect(rect.contentWidth).toBe(793);
		expect(rect.contentHeight).toBe(1122);
		expect(rect.contentTop).toBe(0);
		expect(rect.contentLeft).toBe(0);
	});

	it("uses custom dpi when provided", () => {
		const rect = getContentRect({
			pageSize: A4_PAGE,
			margins: { top: 0, right: 0, bottom: 0, left: 0 },
			dpi: 72,
		});
		// 210mm at 72 dpi: 210/25.4*72 ≈ 595, 297mm ≈ 841 (truncated)
		expect(rect.pageWidthPx).toBe(595);
		expect(rect.pageHeightPx).toBe(841);
	});

	it("subtracts margins from content dimensions", () => {
		const rect = getContentRect({
			pageSize: { widthMm: 210, heightMm: 297 },
			margins: { top: 20, right: 15, bottom: 20, left: 15 },
			dpi: 96,
		});
		expect(rect.contentTop).toBe(20);
		expect(rect.contentLeft).toBe(15);
		expect(rect.contentWidth).toBe(793 - 15 - 15);
		expect(rect.contentHeight).toBe(1122 - 20 - 20);
		expect(rect.pageWidthPx).toBe(793);
		expect(rect.pageHeightPx).toBe(1122);
	});
});

describe("A4_PAGE", () => {
	it("has standard A4 dimensions in mm", () => {
		expect(A4_PAGE.widthMm).toBe(210);
		expect(A4_PAGE.heightMm).toBe(297);
	});
});
