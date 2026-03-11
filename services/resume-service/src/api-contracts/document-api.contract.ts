/**
 * API contract schemas for document endpoints.
 * Used for validation and e2e contract baselines.
 */

import { DocumentDetailSchema, DocumentInfoSchema } from "@algo/cv-core";
import { z } from "zod";

/** POST /documents/parse-pdf response */
export const ParsePdfResponseSchema = z.object({
	data: z.object({
		title: z.string().optional(),
		fieldValues: z.record(z.string(), z.string()),
	}),
});

/** GET /documents response */
export const GetDocumentListResponseSchema = z.object({
	data: z.array(DocumentInfoSchema),
});

/** GET /documents/:id response */
export const GetDocumentResponseSchema = z.object({
	data: DocumentDetailSchema,
});

/** POST /documents response */
export const CreateDocumentResponseSchema = z.object({
	data: DocumentDetailSchema,
});

/** PATCH /documents/:id response */
export const UpdateDocumentResponseSchema = z.object({
	data: DocumentDetailSchema,
});

/** DELETE /documents/:id response */
export const DeleteDocumentResponseSchema = z.object({
	success: z.boolean(),
});

/** POST /documents/:id/rewrite-field response (preview: value only) */
export const RewriteFieldPreviewResponseSchema = z.object({
	data: z.object({ value: z.string() }),
});

/** POST /documents/:id/rewrite-field response (apply: full document) */
export const RewriteFieldApplyResponseSchema = z.object({
	data: DocumentDetailSchema,
});

export type ParsePdfResponse = z.infer<typeof ParsePdfResponseSchema>;
export type GetDocumentListResponse = z.infer<typeof GetDocumentListResponseSchema>;
export type GetDocumentResponse = z.infer<typeof GetDocumentResponseSchema>;
export type CreateDocumentResponse = z.infer<typeof CreateDocumentResponseSchema>;
export type UpdateDocumentResponse = z.infer<typeof UpdateDocumentResponseSchema>;
export type DeleteDocumentResponse = z.infer<typeof DeleteDocumentResponseSchema>;
