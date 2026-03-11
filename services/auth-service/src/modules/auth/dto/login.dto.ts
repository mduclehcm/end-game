import { IsString, MinLength } from "class-validator";

export class LoginDto {
	/** Email or username */
	@IsString()
	login!: string;

	@IsString()
	@MinLength(1)
	password!: string;
}
