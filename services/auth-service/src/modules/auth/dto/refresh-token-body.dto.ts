import { IsString, MinLength } from "class-validator";

export class RefreshTokenBodyDto {
	@IsString()
	@MinLength(1)
	refreshToken!: string;
}
