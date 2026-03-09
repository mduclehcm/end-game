import { z } from "zod";
import { DocumentSourceSchema } from "./common.schema";

export const DocumentInfoSchema = z.object({
	id: z.string().length(10),
	title: z.string().max(50),
	source: DocumentSourceSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const DocumentInfoListSchema = z.array(DocumentInfoSchema);

export type DocumentInfo = z.infer<typeof DocumentInfoSchema>;
