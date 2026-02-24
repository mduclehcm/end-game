import type { UpdateDocumentPayload } from "@algo/cv-core";
import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateDocumentPayloadDto implements UpdateDocumentPayload {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	title?: string;

	@IsOptional()
	@IsObject()
	fields?: Record<string, string>;
}
