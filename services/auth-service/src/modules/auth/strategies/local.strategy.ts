import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { compare } from "bcryptjs";
import { Strategy } from "passport-local";
import type { UserRow } from "../../../database/schema";
import { UserRepository } from "../user.repository";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
	constructor(private readonly userRepository: UserRepository) {
		super({
			usernameField: "login",
			passwordField: "password",
		});
	}

	async validate(login: string, password: string): Promise<UserRow> {
		const isEmail = login.includes("@");
		const user = isEmail
			? await this.userRepository.findByEmail(login)
			: await this.userRepository.findByUsername(login);
		if (!user?.passwordHash) throw new UnauthorizedException("Invalid login or password");
		const ok = await compare(password, user.passwordHash);
		if (!ok) throw new UnauthorizedException("Invalid login or password");
		return user;
	}
}
