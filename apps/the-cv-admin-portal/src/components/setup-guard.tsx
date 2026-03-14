import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiGetSetupStatus } from "@/lib/auth-api";

/**
 * Wraps the login page: if no admin exists, redirect to /setup.
 * Wraps the setup page: if an admin already exists, redirect to /login.
 */
export function RequireNoSetup({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<"loading" | "needs-setup" | "ready">("loading");

	useEffect(() => {
		apiGetSetupStatus()
			.then((res) => setState(res.needsSetup ? "needs-setup" : "ready"))
			.catch(() => setState("ready"));
	}, []);

	if (state === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	if (state === "needs-setup") {
		return <Navigate to="/setup" replace />;
	}

	return <>{children}</>;
}

export function RequireSetupNeeded({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<"loading" | "needs-setup" | "done">("loading");

	useEffect(() => {
		apiGetSetupStatus()
			.then((res) => setState(res.needsSetup ? "needs-setup" : "done"))
			.catch(() => setState("done"));
	}, []);

	if (state === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	if (state === "done") {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}
