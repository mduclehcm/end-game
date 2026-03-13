import type { Page } from "puppeteer";
import { createBrowserMeasureAdapter, MEASURE_PAGE_HTML } from "./browser-measure.adapter";

function mockPage(evaluate: Page["evaluate"]): Page {
	return { evaluate } as unknown as Page;
}

describe("browser-measure.adapter", () => {
	describe("createBrowserMeasureAdapter", () => {
		it("measureText returns height and lineCount from page.evaluate", async () => {
			const mockEvaluate = jest.fn().mockResolvedValue(24);
			const page = mockPage(mockEvaluate);
			const adapter = createBrowserMeasureAdapter(page);

			const result = await adapter.measureText({
				content: "Hello",
				width: 200,
				style: { fontSize: 12, lineHeight: 16 },
				isHtml: false,
			});

			expect(result).toEqual({ height: 24, lineCount: 2 });
			expect(mockEvaluate).toHaveBeenCalledWith(expect.any(Function), {
				content: "Hello",
				width: 200,
				baseCss: expect.any(String),
				isHtml: false,
			});
		});

		it("measureTextNaturalWidth returns ceil width from page.evaluate", async () => {
			const mockEvaluate = jest.fn().mockResolvedValue(42);
			const page = mockPage(mockEvaluate);
			const adapter = createBrowserMeasureAdapter(page);
			const measureNaturalWidth = adapter.measureTextNaturalWidth;
			if (!measureNaturalWidth) throw new Error("adapter.measureTextNaturalWidth is required");

			const result = await measureNaturalWidth({
				content: "Short",
				style: { fontSize: 14 },
			});

			expect(result).toBe(42);
			expect(mockEvaluate).toHaveBeenCalledWith(expect.any(Function), {
				content: "Short",
				baseCss: expect.stringContaining("white-space:nowrap"),
			});
		});

		it("getImageSize returns dimensions from page.evaluate", async () => {
			const mockEvaluate = jest.fn().mockResolvedValue({ width: 100, height: 50 });
			const page = mockPage(mockEvaluate);
			const adapter = createBrowserMeasureAdapter(page);

			const result = await adapter.getImageSize("https://example.com/img.png");

			expect(result).toEqual({ width: 100, height: 50 });
			expect(mockEvaluate).toHaveBeenCalledWith(expect.any(Function), "https://example.com/img.png");
		});

		it("getImageSize returns 0,0 for empty src", async () => {
			const page = mockPage(jest.fn());
			const adapter = createBrowserMeasureAdapter(page);

			const result = await adapter.getImageSize("");

			expect(result).toEqual({ width: 0, height: 0 });
			expect(page.evaluate).not.toHaveBeenCalled();
		});
	});

	describe("MEASURE_PAGE_HTML", () => {
		it("includes same body font as export document", () => {
			expect(MEASURE_PAGE_HTML).toContain("system-ui");
			expect(MEASURE_PAGE_HTML).toContain("sans-serif");
		});
	});
});
