const AUTH_BASE = "/api/auth";

export interface AuthUser {
	id: string;
	email: string;
	username: string | null;
	displayName: string;
	avatarUrl: string | null;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: AuthUser;
}

export async function apiLogin(login: string, password: string): Promise<AuthResponse> {
	const res = await fetch(`${AUTH_BASE}/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ login, password }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string }).message ?? `Login failed: ${res.status}`);
	}
	return res.json() as Promise<AuthResponse>;
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
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error((err as { message?: string }).message ?? `Registration failed: ${res.status}`);
	}
	return res.json() as Promise<AuthResponse>;
}

export async function apiRefreshToken(refreshToken: string): Promise<AuthResponse> {
	const res = await fetch(`${AUTH_BASE}/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken }),
	});
	if (!res.ok) {
		throw new Error("Refresh failed");
	}
	return res.json() as Promise<AuthResponse>;
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
	if (!res.ok) {
		throw new Error("Get me failed");
	}
	return res.json() as Promise<AuthUser>;
}
