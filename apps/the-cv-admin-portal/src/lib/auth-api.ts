const AUTH_BASE = "/api/auth";
const ADMIN_BASE = "/api/admin";

export interface AuthUser {
	id: string;
	email: string;
	username: string | null;
	displayName: string;
	avatarUrl: string | null;
	role: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: AuthUser;
}

async function jsonOrThrow<T>(res: Response, action: string): Promise<T> {
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string }).message ?? `${action} failed: ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export async function apiLogin(login: string, password: string): Promise<AuthResponse> {
	const res = await fetch(`${AUTH_BASE}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ login, password }),
	});
	return jsonOrThrow<AuthResponse>(res, "Login");
}

export interface RegisterPayload {
	email: string;
	password: string;
	username?: string;
	displayName?: string;
}

export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
	const res = await fetch(`${AUTH_BASE}/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	return jsonOrThrow<AuthResponse>(res, "Registration");
}

export async function apiRefreshToken(refreshToken: string): Promise<AuthResponse> {
	const res = await fetch(`${AUTH_BASE}/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
	return jsonOrThrow<AuthResponse>(res, "Refresh");
}

export async function apiLogout(refreshToken: string): Promise<void> {
	await fetch(`${AUTH_BASE}/logout`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
}

export async function apiGetMe(accessToken: string): Promise<AuthUser> {
	const res = await fetch(`${AUTH_BASE}/me`, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	return jsonOrThrow<AuthUser>(res, "Get me");
}

export async function apiSetup(payload: RegisterPayload): Promise<AuthResponse> {
	const res = await fetch(`${ADMIN_BASE}/setup`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	return jsonOrThrow<AuthResponse>(res, "Setup");
}

export async function apiGetSetupStatus(): Promise<{ needsSetup: boolean }> {
	const res = await fetch(`${ADMIN_BASE}/setup/status`);
	return jsonOrThrow<{ needsSetup: boolean }>(res, "Setup status");
}
