import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { AuthUser } from "@/lib/auth-api";
import { apiGetMe, apiLogin, apiLogout, apiRefreshToken, apiSetup, type RegisterPayload } from "@/lib/auth-api";

const AUTH_STORAGE_KEYS = {
	accessToken: "admin_auth_access_token",
	refreshToken: "admin_auth_refresh_token",
	expiresAt: "admin_auth_expires_at",
	user: "admin_auth_user",
} as const;

const REFRESH_BEFORE_MS = 2 * 60 * 1000;

function loadStored(): {
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number | null;
	user: AuthUser | null;
} {
	try {
		const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
		const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
		const expiresAtRaw = localStorage.getItem(AUTH_STORAGE_KEYS.expiresAt);
		const userRaw = localStorage.getItem(AUTH_STORAGE_KEYS.user);
		const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;
		const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
		return { accessToken, refreshToken, expiresAt, user };
	} catch {
		return { accessToken: null, refreshToken: null, expiresAt: null, user: null };
	}
}

function persist(accessToken: string, refreshToken: string, expiresAt: number, user: AuthUser): void {
	localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
	localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
	localStorage.setItem(AUTH_STORAGE_KEYS.expiresAt, String(expiresAt));
	localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
}

function clearStorage(): void {
	for (const key of Object.values(AUTH_STORAGE_KEYS)) {
		localStorage.removeItem(key);
	}
}

export interface AuthState {
	user: AuthUser | null;
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	refreshTimerId: ReturnType<typeof setTimeout> | null;

	login: (login: string, password: string) => Promise<void>;
	setup: (payload: RegisterPayload) => Promise<void>;
	logout: () => Promise<void>;
	refreshAuth: () => Promise<void>;
	initialize: () => Promise<void>;
}

function applyAuthResponse(
	set: (partial: Partial<AuthState>) => void,
	get: () => AuthState,
	res: { accessToken: string; refreshToken: string; expiresIn: number; user: AuthUser },
) {
	const expiresAt = Date.now() + res.expiresIn * 1000;
	persist(res.accessToken, res.refreshToken, expiresAt, res.user);
	set({
		user: res.user,
		accessToken: res.accessToken,
		refreshToken: res.refreshToken,
		expiresAt,
		isAuthenticated: true,
	});
	scheduleRefresh(get, set);
}

function scheduleRefresh(get: () => AuthState, set: (partial: Partial<AuthState>) => void): void {
	const state = get();
	if (state.refreshTimerId !== null) {
		clearTimeout(state.refreshTimerId);
		set({ refreshTimerId: null });
	}
	const { expiresAt, refreshToken } = get();
	if (!expiresAt || !refreshToken) return;
	const delay = Math.max(0, expiresAt - REFRESH_BEFORE_MS - Date.now());
	if (delay <= 0) {
		get().refreshAuth().catch(() => {});
		return;
	}
	const id = setTimeout(() => {
		get().refreshAuth().catch(() => {});
	}, delay);
	set({ refreshTimerId: id });
}

export const useAuthStore = create<AuthState>()(
	subscribeWithSelector((set, get) => ({
		user: null,
		accessToken: null,
		refreshToken: null,
		expiresAt: null,
		isAuthenticated: false,
		isLoading: true,
		refreshTimerId: null,

		login: async (login: string, password: string) => {
			const res = await apiLogin(login, password);
			if (res.user.role !== "admin") {
				try {
					await apiLogout(res.refreshToken);
				} catch {
					// best-effort revocation
				}
				throw new Error("Access denied. Admin role required.");
			}
			applyAuthResponse(set, get, res);
		},

		setup: async (payload: RegisterPayload) => {
			const res = await apiSetup(payload);
			applyAuthResponse(set, get, res);
		},

		logout: async () => {
			const { refreshToken, refreshTimerId } = get();
			if (refreshTimerId !== null) clearTimeout(refreshTimerId);
			if (refreshToken) {
				try {
					await apiLogout(refreshToken);
				} catch {
					// ignore
				}
			}
			clearStorage();
			set({
				user: null,
				accessToken: null,
				refreshToken: null,
				expiresAt: null,
				isAuthenticated: false,
				refreshTimerId: null,
			});
		},

		refreshAuth: async () => {
			const refreshToken = get().refreshToken;
			if (!refreshToken) return;
			try {
				const res = await apiRefreshToken(refreshToken);
				applyAuthResponse(set, get, res);
			} catch {
				clearStorage();
				set({
					user: null,
					accessToken: null,
					refreshToken: null,
					expiresAt: null,
					isAuthenticated: false,
					refreshTimerId: null,
				});
			}
		},

		initialize: async () => {
			set({ isLoading: true });
			const { accessToken, refreshToken, expiresAt } = loadStored();
			if (!accessToken || !refreshToken) {
				set({ isLoading: false });
				return;
			}
			const now = Date.now();
			if (expiresAt && expiresAt - REFRESH_BEFORE_MS <= now) {
				try {
					const res = await apiRefreshToken(refreshToken);
					if (res.user.role !== "admin") {
						try {
							await apiLogout(res.refreshToken);
						} catch {
							// best-effort revocation
						}
						clearStorage();
						set({ isLoading: false });
						return;
					}
					applyAuthResponse(set, get, res);
					set({ isLoading: false });
				} catch {
					clearStorage();
					set({ isLoading: false });
				}
				return;
			}
			try {
				const me = await apiGetMe(accessToken);
				if (me.role !== "admin") {
					try {
						await apiLogout(refreshToken);
					} catch {
						// best-effort revocation
					}
					clearStorage();
					set({ isLoading: false });
					return;
				}
				set({
					user: me,
					accessToken,
					refreshToken,
					expiresAt,
					isAuthenticated: true,
					isLoading: false,
				});
				scheduleRefresh(get, set);
			} catch {
				try {
					const res = await apiRefreshToken(refreshToken);
					if (res.user.role !== "admin") {
						try {
							await apiLogout(res.refreshToken);
						} catch {
							// best-effort revocation
						}
						clearStorage();
						set({ isLoading: false });
						return;
					}
					applyAuthResponse(set, get, res);
					set({ isLoading: false });
				} catch {
					clearStorage();
					set({ isLoading: false });
				}
			}
		},
	})),
);
