import type { CreateDocumentPayload } from "@algo/cv-core";
import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateDocumentPayloadDto implements CreateDocumentPayload {
	@IsString()
	@MaxLength(50)
	title: string;

	@IsOptional()
	@IsObject()
	fieldValues?: Record<string, string>;
}
