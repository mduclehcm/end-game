import { z } from "zod";
import { DocumentSourceSchema } from "./common.schema";

const FieldSchema = z.object({
	id: z.string().length(10),
	type: z.string().max(50),
	label: z.string().max(50),
	placeholder: z.string().max(50),
	colSpan: z.number(),
});

const EntitySchema = z.object({
	id: z.string().length(10),
	kind: z.string().max(50),
	fields: z.array(FieldSchema),
});

const SectionSchema = z.object({
	id: z.string().length(10),
	kind: z.string().max(50),
	entityIds: z.array(z.string().length(10)), // display order
	entities: z.array(EntitySchema),
});

const DocumentData = z.object({
	sectionIds: z.array(z.string().length(10)), // display order
	sections: z.array(SectionSchema),
	fieldValues: z.record(z.string(), z.string()),
});

export const DocumentDetailSchema = z
	.object({
		id: z.string().length(10),
		title: z.string().max(50),
		source: DocumentSourceSchema,
		createdAt: z.string(),
		updatedAt: z.string(),

		data: DocumentData,
	})
	.strict();

export type DocumentData = z.infer<typeof DocumentData>;
export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;
