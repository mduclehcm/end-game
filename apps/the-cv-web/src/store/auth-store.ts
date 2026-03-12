import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { AuthUser } from "@/lib/auth-api";
import { apiGetMe, apiLogin, apiLogout, apiRefreshToken, apiRegister, type RegisterPayload } from "@/lib/auth-api";
import { Logger } from "@/lib/logger";

const AUTH_STORAGE_KEYS = {
	accessToken: "auth_access_token",
	refreshToken: "auth_refresh_token",
	expiresAt: "auth_expires_at",
	user: "auth_user",
} as const;

const REFRESH_BEFORE_MS = 2 * 60 * 1000; // 2 minutes before expiry

const logger = new Logger("AuthStore");

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
	localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
	localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
	localStorage.removeItem(AUTH_STORAGE_KEYS.expiresAt);
	localStorage.removeItem(AUTH_STORAGE_KEYS.user);
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
	register: (payload: RegisterPayload) => Promise<void>;
	logout: () => Promise<void>;
	refreshAuth: () => Promise<void>;
	initialize: () => Promise<void>;
}

function scheduleRefresh(get: () => AuthState, set: (partial: Partial<AuthState>) => void): void {
	const state = get();
	if (state.refreshTimerId !== null) {
		clearTimeout(state.refreshTimerId);
		set({ refreshTimerId: null });
	}
	const expiresAt = get().expiresAt;
	const refreshToken = get().refreshToken;
	if (!expiresAt || !refreshToken) return;
	const delay = Math.max(0, expiresAt - REFRESH_BEFORE_MS - Date.now());
	if (delay <= 0) {
		get()
			.refreshAuth()
			.catch(() => {});
		return;
	}
	const id = setTimeout(() => {
		get()
			.refreshAuth()
			.catch(() => {});
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
			logger.info("logged in", res.user.email);
		},

		register: async (payload: RegisterPayload) => {
			const res = await apiRegister(payload);
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
			logger.info("registered", res.user.email);
		},

		logout: async () => {
			const { refreshToken, refreshTimerId } = get();
			if (refreshTimerId !== null) {
				clearTimeout(refreshTimerId);
			}
			if (refreshToken) {
				try {
					await apiLogout(refreshToken);
				} catch (e) {
					logger.errorObj("logout api error", e);
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
			logger.info("logged out");
		},

		refreshAuth: async () => {
			const refreshToken = get().refreshToken;
			if (!refreshToken) return;
			try {
				const res = await apiRefreshToken(refreshToken);
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
				logger.debug("token refreshed");
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
				logger.warn("refresh failed, logged out");
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
					const newExpiresAt = Date.now() + res.expiresIn * 1000;
					persist(res.accessToken, res.refreshToken, newExpiresAt, res.user);
					set({
						user: res.user,
						accessToken: res.accessToken,
						refreshToken: res.refreshToken,
						expiresAt: newExpiresAt,
						isAuthenticated: true,
						isLoading: false,
					});
					scheduleRefresh(get, set);
				} catch {
					clearStorage();
					set({
						user: null,
						accessToken: null,
						refreshToken: null,
						expiresAt: null,
						isAuthenticated: false,
						isLoading: false,
					});
				}
				return;
			}
			try {
				const me = await apiGetMe(accessToken);
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
					const newExpiresAt = Date.now() + res.expiresIn * 1000;
					persist(res.accessToken, res.refreshToken, newExpiresAt, res.user);
					set({
						user: res.user,
						accessToken: res.accessToken,
						refreshToken: res.refreshToken,
						expiresAt: newExpiresAt,
						isAuthenticated: true,
						isLoading: false,
					});
					scheduleRefresh(get, set);
				} catch {
					clearStorage();
					set({
						user: null,
						accessToken: null,
						refreshToken: null,
						expiresAt: null,
						isAuthenticated: false,
						isLoading: false,
					});
				}
			}
		},
	})),
);
