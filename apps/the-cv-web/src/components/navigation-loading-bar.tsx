"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const NavigationContext = createContext<{
	isNavigating: boolean;
	setNavigating: (value: boolean) => void;
} | null>(null);

function useNavigationLoading() {
	const context = useContext(NavigationContext);
	if (!context) return { isNavigating: false, setNavigating: () => {} };
	return context;
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
	const [isNavigating, setNavigating] = useState(false);
	const location = useLocation();

	// Clear loading when location has changed (navigation committed)
	// biome-ignore lint/correctness/useExhaustiveDependencies: clear loading when route changes
	useEffect(() => {
		setNavigating(false);
	}, [location]);

	// Detect internal link clicks to show loading immediately
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			const anchor = target.closest("a[href]");
			if (!anchor) return;
			const href = (anchor as HTMLAnchorElement).getAttribute("href");
			if (!href) return;
			// Same-origin or path-only navigation
			if (href.startsWith("/") || (typeof window !== "undefined" && href.startsWith(window.location.origin))) {
				setNavigating(true);
			}
		}
		document.addEventListener("click", handleClick, true);
		return () => document.removeEventListener("click", handleClick, true);
	}, []);

	return <NavigationContext.Provider value={{ isNavigating, setNavigating }}>{children}</NavigationContext.Provider>;
}

export function NavigationLoadingBar() {
	const { isNavigating } = useNavigationLoading();

	if (!isNavigating) return null;

	return (
		<div
			className="fixed left-0 right-0 top-0 z-9999 h-0.5 overflow-hidden bg-primary/20"
			aria-hidden
			role="progressbar"
			aria-busy
		>
			<div className="navigation-loading-bar-indicator" />
		</div>
	);
}
