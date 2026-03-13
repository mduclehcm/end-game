/**
 * API contract schemas for export endpoints.
 * Shared between backend (resume-service) and frontend (the-cv-web).
 */

import { z } from "zod";

export const ExportStatusSchema = z.enum(["pending", "processing", "ready", "failed"]);
export type ExportStatus = z.infer<typeof ExportStatusSchema>;

export const ExportInfoSchema = z.object({
	id: z.string(),
	documentId: z.string(),
	status: ExportStatusSchema,
	format: z.string(),
	fileName: z.string().nullable(),
	sizeBytes: z.number().nullable(),
	errorMessage: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	completedAt: z.string().nullable(),
});
export type ExportInfo = z.infer<typeof ExportInfoSchema>;

/** POST /resume/exports request */
export const CreateExportRequestSchema = z.object({
	documentId: z.string(),
});
export type CreateExportRequest = z.infer<typeof CreateExportRequestSchema>;

/** POST /resume/exports response (202 Accepted) */
export const CreateExportResponseSchema = z.object({
	data: z.object({
		id: z.string(),
		status: z.literal("pending"),
	}),
});
export type CreateExportResponse = z.infer<typeof CreateExportResponseSchema>;

/** GET /resume/exports response */
export const GetExportListResponseSchema = z.object({
	data: z.array(ExportInfoSchema),
});
export type GetExportListResponse = z.infer<typeof GetExportListResponseSchema>;

/** POST /resume/exports/:id/download-link response */
export const CreateDownloadLinkResponseSchema = z.object({
	data: z.object({
		downloadUrl: z.string(),
		expiresInSeconds: z.number(),
	}),
});
export type CreateDownloadLinkResponse = z.infer<typeof CreateDownloadLinkResponseSchema>;
