import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class RewriteFieldDto {
	@IsString()
	@MinLength(1, { message: "sectionId must not be empty" })
	sectionId!: string;

	@IsString()
	@MinLength(1, { message: "entityId must not be empty" })
	entityId!: string;

	@IsString()
	@MinLength(1, { message: "fieldId must not be empty" })
	fieldId!: string;

	/** Section kind (e.g. summary, experience, education) for AI prompt selection. */
	@IsString()
	@MinLength(1, { message: "sectionKind must not be empty" })
	sectionKind!: string;

	/** Field key (e.g. text, description) for AI prompt selection. */
	@IsString()
	@MinLength(1, { message: "fieldKey must not be empty" })
	fieldKey!: string;

	@IsOptional()
	@IsBoolean()
	apply?: boolean;
}
