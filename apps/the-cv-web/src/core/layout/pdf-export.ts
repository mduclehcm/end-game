import type { Fragment, FragmentTextContent, FragmentTree, PageFragment } from "@/core/layout";

const PX_TO_PT = 72 / 96;

function pxToPt(px: number): number {
	return px * PX_TO_PT;
}

/**
 * Draw the fragment tree to a jsPDF document.
 * Install jspdf: pnpm add jspdf
 * Coordinates are converted from layout px (96 DPI) to PDF pt (72 DPI).
 */
export async function exportFragmentTreeToPdf(
	fragmentTree: FragmentTree,
	options?: { title?: string },
): Promise<Uint8Array> {
	const { jsPDF } = await import("jspdf");

	const first = fragmentTree[0];
	if (!first) {
		const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
		return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
	}

	const doc = new jsPDF({
		orientation: "portrait",
		unit: "pt",
		format: "a4",
		hotfixes: ["px_scaling"],
	});

	function drawFragment(frag: Fragment, offsetX: number, offsetY: number): void {
		const x = offsetX + pxToPt(frag.x);
		const y = offsetY + pxToPt(frag.y);
		const w = pxToPt(frag.width);
		const h = pxToPt(frag.height);

		switch (frag.content.kind) {
			case "text": {
				const c = frag.content as FragmentTextContent;
				const style = c.style;
				if (style.fontSize) doc.setFontSize(style.fontSize * PX_TO_PT);
				if (style.fontWeight !== undefined) doc.setFont("helvetica", style.fontWeight === 700 ? "bold" : "normal");
				if (style.color) {
					const hex = style.color.replace("#", "");
					const r = parseInt(hex.slice(0, 2), 16) / 255;
					const g = parseInt(hex.slice(2, 4), 16) / 255;
					const b = parseInt(hex.slice(4, 6), 16) / 255;
					doc.setTextColor(r, g, b);
				}
				doc.text(c.fullContent, x, y + (style.fontSize ?? 12) * PX_TO_PT, { maxWidth: w });
				break;
			}
			case "image": {
				if (frag.content.src) {
					try {
						doc.addImage(frag.content.src, "JPEG", x, y, w, h);
					} catch {
						// If not JPEG, try PNG or skip
						try {
							doc.addImage(frag.content.src, "PNG", x, y, w, h);
						} catch {
							// Skip image on error (e.g. CORS)
						}
					}
				}
				break;
			}
			case "block": {
				for (const child of frag.content.children) {
					drawFragment(child, x, y);
				}
				break;
			}
		}
	}

	for (const page of fragmentTree as PageFragment[]) {
		if (page.pageIndex > 0) {
			doc.addPage();
		}
		const offsetX = 0;
		const offsetY = 0;
		for (const frag of page.fragments) {
			drawFragment(frag, offsetX, offsetY);
		}
	}

	if (options?.title) {
		doc.setProperties({ title: options.title });
	}

	return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}

/**
 * Trigger download of the PDF (e.g. "resume.pdf").
 */
export async function downloadFragmentTreePdf(
	fragmentTree: FragmentTree,
	filename: string,
	options?: { title?: string },
): Promise<void> {
	const buffer = await exportFragmentTreeToPdf(fragmentTree, options);
	const blob = new Blob([buffer.buffer as ArrayBuffer], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
