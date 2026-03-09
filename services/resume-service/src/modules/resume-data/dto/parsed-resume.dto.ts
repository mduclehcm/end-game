/**
 * Response shape for POST /documents/parse-pdf.
 * AI parses the resume PDF into structured field values using our document field keys.
 */
export interface ParsedResumeDto {
	title?: string;
	fieldValues: Record<string, string>;
}
