import z from "zod";

export enum DocumentSource {
	Local = "local",
	Cloud = "cloud",
}

export const DocumentSourceSchema = z.enum(Object.values(DocumentSource));
