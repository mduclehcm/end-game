import type { DocumentDetail } from "@algo/cv-core";
import { Injectable } from "@nestjs/common";
import { jsPDF } from "jspdf";

const MARGIN = 20;
const LINE_HEIGHT = 6;
const TITLE_FONT_SIZE = 18;
const SECTION_FONT_SIZE = 14;
const BODY_FONT_SIZE = 10;
const MAX_WIDTH = 210 - 2 * MARGIN; // A4 mm

@Injectable()
export class PdfGeneratorService {
	/**
	 * Generate a simple PDF from document detail (server-side layout).
	 * For pixel-perfect match with the frontend, the layout algorithm could be shared in a package.
	 */
	async generatePdf(document: DocumentDetail): Promise<Buffer> {
		const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
		let y = MARGIN;

		doc.setFontSize(TITLE_FONT_SIZE);
		doc.setFont("helvetica", "bold");
		doc.text(document.title, MARGIN, y);
		y += LINE_HEIGHT * 2;

		const sectionsById = new Map(document.data.sections.map((s) => [s.id, s]));
		for (const sectionId of document.data.sectionIds) {
			const section = sectionsById.get(sectionId);
			if (!section) continue;

			doc.setFontSize(SECTION_FONT_SIZE);
			doc.setFont("helvetica", "bold");
			const sectionTitle = section.kind.charAt(0).toUpperCase() + section.kind.slice(1);
			doc.text(sectionTitle, MARGIN, y);
			y += LINE_HEIGHT * 1.5;

			doc.setFontSize(BODY_FONT_SIZE);
			doc.setFont("helvetica", "normal");

			const orderedEntityIds = section.entityIds;
			const entitiesById = new Map(section.entities.map((e) => [e.id, e]));
			for (const entityId of orderedEntityIds) {
				const entity = entitiesById.get(entityId);
				if (!entity) continue;
				for (const field of entity.fields) {
					const value = document.data.fieldValues[field.id];
					if (value == null || String(value).trim() === "") continue;
					const label = field.label || field.key || field.id;
					const lines = doc.splitTextToSize(`${label}: ${value}`, MAX_WIDTH - MARGIN);
					for (const line of lines) {
						if (y > 297 - MARGIN - LINE_HEIGHT) {
							doc.addPage();
							y = MARGIN;
						}
						doc.text(line, MARGIN, y);
						y += LINE_HEIGHT;
					}
					y += LINE_HEIGHT * 0.5;
				}
			}
			y += LINE_HEIGHT;
		}

		const buf = doc.output("arraybuffer") as ArrayBuffer;
		return Buffer.from(buf);
	}
}
