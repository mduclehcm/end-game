import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { hash } from "bcryptjs";
import type { Request } from "express";
import { UserRole } from "../../database/schema/user.schema";
import { AuthService } from "./auth.service";
import { AdminGuard } from "./guards/admin.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { JwtPayload } from "./strategies/jwt.strategy";
import { UserRepository } from "./user.repository";

@Controller("admin")
export class AdminController {
	constructor(
		private readonly authService: AuthService,
		private readonly userRepository: UserRepository,
	) {}

	/** One-time setup: register first admin when no admin exists yet. */
	@Post("setup")
	async setup(
		@Body()
		body: { email: string; password: string; username?: string; displayName?: string },
	) {
		const passwordHash = await hash(body.password, 10);
		const result = await this.userRepository.createFirstAdmin({
			email: body.email,
			passwordHash,
			username: body.username,
			displayName: body.displayName,
		});

		if (!result.created) {
			switch (result.reason) {
				case "admin_exists":
					throw new ConflictException("Setup already completed. An admin already exists.");
				case "email_taken":
					throw new ConflictException("Email already registered");
				case "username_taken":
					throw new ConflictException("Username already taken");
			}
		}

		return this.authService.buildAuthResponseForUser(result.user);
	}

	@Get("users")
	@UseGuards(JwtAuthGuard, AdminGuard)
	async listUsers(@Query("limit") limit?: string, @Query("offset") offset?: string, @Query("search") search?: string) {
		const l = Math.min(Math.max(Number(limit) || 50, 1), 200);
		const o = Math.max(Number(offset) || 0, 0);
		const { users, total } = await this.userRepository.findAll({
			limit: l,
			offset: o,
			search: search || undefined,
		});
		return {
			data: users.map((u) => ({
				id: u.id,
				email: u.email,
				username: u.username,
				displayName: u.displayName,
				avatarUrl: u.avatarUrl,
				role: u.role,
				createdAt: u.createdAt,
			})),
			total,
			limit: l,
			offset: o,
		};
	}

	@Patch("users/:id/role")
	@UseGuards(JwtAuthGuard, AdminGuard)
	async changeRole(
		@Param("id") id: string,
		@Body() body: { role: string },
		@Req() req: Request & { user: JwtPayload },
	) {
		if (id === req.user.sub) {
			throw new BadRequestException("Cannot change your own role");
		}
		if (body.role !== UserRole.ADMIN && body.role !== UserRole.USER) {
			throw new BadRequestException(`Invalid role: ${body.role}. Must be "admin" or "user".`);
		}
		const updated = await this.userRepository.updateRole(id, body.role as UserRole);
		if (!updated) throw new BadRequestException("User not found");
		return {
			data: {
				id: updated.id,
				email: updated.email,
				username: updated.username,
				displayName: updated.displayName,
				role: updated.role,
			},
		};
	}

	/** Check whether initial setup is needed (no admin exists). */
	@Get("setup/status")
	async setupStatus() {
		const adminCount = await this.userRepository.countByRole(UserRole.ADMIN);
		return { needsSetup: adminCount === 0 };
	}
}
