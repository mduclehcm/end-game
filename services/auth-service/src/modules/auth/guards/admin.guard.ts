import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "../../../database/schema/user.schema";
import type { JwtPayload } from "../strategies/jwt.strategy";

@Injectable()
export class AdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
		if (!request.user || request.user.role !== UserRole.ADMIN) {
			throw new ForbiddenException("Admin access required");
		}
		return true;
	}
}
