import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

export const X_USER_ID_HEADER = "x-user-id";

export interface RequestUser {
	sub: string;
	email?: string;
}

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}

/**
 * Guard that requires X-User-Id header (set by Kong after JWT validation).
 * Attaches req.user = { sub, email? } for use in controllers.
 */
@Injectable()
export class RequireUserGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const userId = request.headers[X_USER_ID_HEADER];
		const email = request.headers["x-jwt-claim-email"];
		if (!userId || typeof userId !== "string" || userId.trim() === "") {
			throw new UnauthorizedException("Missing or invalid X-User-Id header");
		}
		const sub = userId.trim();
		request.user = { sub, email: typeof email === "string" ? email : undefined };
		return true;
	}
}
