import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
	@IsEmail()
	email!: string;

	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	username?: string;

	@IsString()
	@MinLength(8, { message: "Password must be at least 8 characters" })
	password!: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	displayName?: string;
}
