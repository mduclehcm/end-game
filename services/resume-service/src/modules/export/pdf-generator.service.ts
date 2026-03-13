import type { DocumentDetail } from "@algo/cv-core";
import { Injectable } from "@nestjs/common";
import puppeteer from "puppeteer";
import { createBrowserMeasureAdapter, MEASURE_PAGE_HTML } from "./browser-measure.adapter";
import { fragmentTreeToHtml } from "./fragment-tree-to-html";

/** Fragment tree shape expected by fragmentTreeToHtml (first parameter). */
type FragmentTreeForHtml = Parameters<typeof fragmentTreeToHtml>[0];

/** Loader for the layout pipeline (dynamic import so ESM package can be used from CJS). Injected for tests. */
export type LayoutPipelineLoader = () => Promise<{
	runLayoutPipeline: (data: unknown, adapter: unknown) => Promise<FragmentTreeForHtml | null>;
}>;

@Injectable()
export class PdfGeneratorService {
	/** Overridable for tests; default loads @algo/cv-layout at runtime. */
	loadLayoutPipeline: LayoutPipelineLoader = () => import("@algo/cv-layout");

	/**
	 * Generate a PDF from document using the shared layout pipeline and headless browser.
	 * Layout is measured in the same browser context as the final render so export matches preview.
	 */
	async generatePdf(document: DocumentDetail): Promise<Buffer> {
		const browser = await puppeteer.launch(this.launchOptions());
		try {
			const page = await browser.newPage();
			await page.setContent(MEASURE_PAGE_HTML, { waitUntil: "domcontentloaded" });

			const adapter = createBrowserMeasureAdapter(page);
			const { runLayoutPipeline } = await this.loadLayoutPipeline();
			const fragmentTree: FragmentTreeForHtml | null = await runLayoutPipeline(document.data, adapter);
			if (!fragmentTree || fragmentTree.length === 0) {
				return this.emptyPdfBuffer();
			}

			const html = fragmentTreeToHtml(fragmentTree, { title: document.title });
			await page.setContent(html, {
				waitUntil: "networkidle0",
				timeout: 10000,
			});
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: { top: 0, right: 0, bottom: 0, left: 0 },
			});
			return Buffer.from(pdfBuffer);
		} finally {
			await browser.close();
		}
	}

	private async emptyPdfBuffer(): Promise<Buffer> {
		const browser = await puppeteer.launch(this.launchOptions());
		try {
			const page = await browser.newPage();
			const buf = await page.pdf({ format: "A4" });
			return Buffer.from(buf);
		} finally {
			await browser.close();
		}
	}

	private launchOptions(): Parameters<typeof puppeteer.launch>[0] {
		const args = ["--no-sandbox", "--disable-setuid-sandbox"];
		const options: Parameters<typeof puppeteer.launch>[0] = {
			headless: true,
			args,
		};
		const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
		if (executablePath) {
			options.executablePath = executablePath;
		}
		return options;
	}
}
