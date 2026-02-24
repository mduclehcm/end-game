import type { CreateDocumentPayload } from "@algo/cv-core";
import { IsString, MaxLength } from "class-validator";

export class CreateDocumentPayloadDto implements CreateDocumentPayload {
	@IsString()
	@MaxLength(50)
	title: string;
}
