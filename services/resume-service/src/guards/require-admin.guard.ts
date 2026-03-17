import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { X_USER_ID_HEADER } from "./require-user.guard";

const X_ROLE_HEADER = "x-jwt-claim-role";

@Injectable()
export class RequireAdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const userId = request.headers[X_USER_ID_HEADER];
		if (!userId || typeof userId !== "string" || userId.trim() === "") {
			throw new UnauthorizedException("Missing or invalid X-User-Id header");
		}
		const role = request.headers[X_ROLE_HEADER];
		if (typeof role !== "string" || role !== "admin") {
			throw new ForbiddenException("Admin access required");
		}
		const email = request.headers["x-jwt-claim-email"];
		request.user = { sub: userId.trim(), email: typeof email === "string" ? email : undefined };
		return true;
	}
}
