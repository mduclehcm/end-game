import { IsString } from "class-validator";

export class CreateExportDto {
	@IsString()
	documentId: string;
}
