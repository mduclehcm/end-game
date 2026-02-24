import { z } from "zod";
import { DocumentSourceSchema } from "./common";

export const DocumentDetailSchema = z
	.object({
		id: z.string().length(10),
		title: z.string().max(50),
		source: DocumentSourceSchema,
		createdAt: z.string(),
		updatedAt: z.string(),
		fields: z.record(z.string(), z.string()),
	})
	.strict();

export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;
