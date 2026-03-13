import { type DocumentDetail, DocumentSource } from "@algo/cv-core";
import type { FragmentTree } from "@algo/cv-layout";
import { Test, type TestingModule } from "@nestjs/testing";
import puppeteer from "puppeteer";
import { MEASURE_PAGE_HTML } from "./browser-measure.adapter";
import { PdfGeneratorService } from "./pdf-generator.service";

jest.mock("puppeteer", () => {
	const mockSetContent = jest.fn().mockResolvedValue(undefined);
	const mockPdf = jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 mock"));
	const page = { setContent: mockSetContent, pdf: mockPdf };
	const launch = jest.fn().mockResolvedValue({
		newPage: jest.fn().mockResolvedValue(page),
		close: jest.fn().mockResolvedValue(undefined),
	});
	return {
		__esModule: true,
		default: { launch, __page: page },
	};
});

function getPageMock(): { setContent: jest.Mock; pdf: jest.Mock } {
	return (puppeteer as unknown as { __page: { setContent: jest.Mock; pdf: jest.Mock } }).__page;
}

const mockRunLayoutPipeline = jest.fn();

describe("PdfGeneratorService", () => {
	let service: PdfGeneratorService;

	beforeEach(async () => {
		mockRunLayoutPipeline.mockClear();
		getPageMock().setContent.mockClear();
		getPageMock().pdf.mockClear();
		const module: TestingModule = await Test.createTestingModule({
			providers: [PdfGeneratorService],
		}).compile();
		service = module.get(PdfGeneratorService);
		service.loadLayoutPipeline = () => Promise.resolve({ runLayoutPipeline: mockRunLayoutPipeline as never });
	});

	it("returns non-empty buffer when layout returns fragment tree (HTML→PDF path)", async () => {
		const minimalTree: FragmentTree = [
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
						x: 0,
						y: 0,
						width: 100,
						height: 20,
						content: {
							kind: "text",
							fullContent: "Test",
							lineStart: 0,
							lineCount: 1,
							style: {},
						},
						nextFragmentId: null,
					},
				],
			},
		];
		mockRunLayoutPipeline.mockResolvedValue(minimalTree);

		const document: DocumentDetail = {
			id: "1234567890",
			title: "Test Resume",
			source: DocumentSource.Local,
			createdAt: "2020-01-01T00:00:00Z",
			updatedAt: "2020-01-01T00:00:00Z",
			data: {
				sectionIds: [],
				sections: [],
				fieldValues: {},
			},
		};
		const buffer = await service.generatePdf(document);
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.length).toBeGreaterThan(0);
		expect(mockRunLayoutPipeline).toHaveBeenCalledWith(document.data, expect.any(Object));
	});

	it("loads measure page first then layout HTML (browser measurement path)", async () => {
		mockRunLayoutPipeline.mockResolvedValue([
			{
				pageIndex: 0,
				contentTop: 20,
				contentLeft: 20,
				contentWidth: 554,
				contentHeight: 1083,
				pageWidthPx: 594,
				pageHeightPx: 1123,
				fragments: [],
			},
		]);
		const document: DocumentDetail = {
			id: "1234567890",
			title: "T",
			source: DocumentSource.Local,
			createdAt: "2020-01-01T00:00:00Z",
			updatedAt: "2020-01-01T00:00:00Z",
			data: { sectionIds: [], sections: [], fieldValues: {} },
		};
		await service.generatePdf(document);
		const page = getPageMock();
		expect(page.setContent).toHaveBeenCalledTimes(2);
		expect(page.setContent).toHaveBeenNthCalledWith(1, MEASURE_PAGE_HTML, {
			waitUntil: "domcontentloaded",
		});
	});
});
