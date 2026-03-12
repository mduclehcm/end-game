const AUTH_REDIRECT_KEY = "auth_redirect_count";
export const AUTH_REDIRECT_MAX = 5;

export function getRedirectCount(): number {
	try {
		return parseInt(sessionStorage.getItem(AUTH_REDIRECT_KEY) ?? "0", 10);
	} catch {
		return 0;
	}
}

export function incrementRedirectCount(): number {
	const count = getRedirectCount() + 1;
	sessionStorage.setItem(AUTH_REDIRECT_KEY, String(count));
	return count;
}

export function clearRedirectCount(): void {
	try {
		sessionStorage.removeItem(AUTH_REDIRECT_KEY);
	} catch {
		/* ignore */
	}
}
