/**
 * API contract schemas for document endpoints.
 * Used for validation and e2e contract baselines.
 * Shared between backend (resume-service) and frontend (the-cv-web).
 */

import { z } from "zod";
import { DocumentDetailSchema } from "../schema/document-detail.schema";
import { DocumentInfoSchema } from "../schema/document-info.schema";

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
