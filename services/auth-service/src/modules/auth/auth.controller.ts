import {
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshTokenBodyDto } from "./dto/refresh-token-body.dto";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { ZaloAuthGuard } from "./guards/zalo-auth.guard";
import type { JwtPayload } from "./strategies/jwt.strategy";
import type { UserRow } from "../../database/schema";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	async register(@Body() dto: RegisterDto) {
		return this.authService.register({
			email: dto.email,
			username: dto.username,
			password: dto.password,
			displayName: dto.displayName,
		});
	}

	@Post("login")
	@UseGuards(LocalAuthGuard)
	async login(@Req() req: Request & { user: UserRow }) {
		return this.authService.login(req.user);
	}

	@Get("google")
	@UseGuards(GoogleAuthGuard)
	async googleAuth() {
		// Guard redirects to Google
	}

	@Get("google/callback")
	@UseGuards(GoogleAuthGuard)
	async googleCallback(@Req() req: Request & { user: UserRow }, @Res() res: Response) {
		const response = await this.authService.login(req.user);
		return this.sendTokenResponse(res, response);
	}

	@Get("zalo")
	@UseGuards(ZaloAuthGuard)
	async zaloAuth() {
		// Guard redirects to Zalo
	}

	@Get("zalo/callback")
	@UseGuards(ZaloAuthGuard)
	async zaloCallback(@Req() req: Request & { user: UserRow }, @Res() res: Response) {
		const response = await this.authService.login(req.user);
		return this.sendTokenResponse(res, response);
	}

	@Post("refresh")
	async refresh(@Body() dto: RefreshTokenBodyDto) {
		const result = await this.authService.refresh(dto.refreshToken);
		if (!result) throw new UnauthorizedException("Invalid or expired refresh token");
		return result;
	}

	@Post("logout")
	async logout(@Body() dto: RefreshTokenBodyDto) {
		await this.authService.logout(dto.refreshToken);
		return { success: true };
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	async me(@Req() req: Request & { user: JwtPayload }) {
		const user = await this.authService.getUserById(req.user.sub);
		if (!user) throw new UnauthorizedException("User not found");
		return {
			id: user.id,
			email: user.email,
			username: user.username,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl,
		};
	}

	private sendTokenResponse(
		res: Response,
		response: { accessToken: string; refreshToken: string; expiresIn: number; user: unknown },
	): Response {
		return res.json(response);
	}
}
