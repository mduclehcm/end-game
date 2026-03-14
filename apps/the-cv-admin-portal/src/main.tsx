import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./components/protected-route";
import { RequireNoSetup, RequireSetupNeeded } from "./components/setup-guard";
import { queryClient } from "./lib/query-client";
import AiUsagePage from "./pages/ai-usage";
import AiUsageDetailPage from "./pages/ai-usage/detail";
import LoginPage from "./pages/login";
import SetupPage from "./pages/setup";
import SystemPromptsPage from "./pages/system-prompts";
import SystemPromptDetailPage from "./pages/system-prompts/detail";
import UsersPage from "./pages/users";
import { useAuthStore } from "./store/auth-store";
import "./index.css";
import { TooltipProvider } from "./components/ui/tooltip";

function AuthInitializer({ children }: { children: React.ReactNode }) {
	const initialize = useAuthStore((s) => s.initialize);
	useEffect(() => {
		initialize();
	}, [initialize]);
	return <>{children}</>;
}

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element not found");
}
createRoot(rootEl).render(
	<QueryClientProvider client={queryClient}>
		<BrowserRouter>
			<TooltipProvider>
				<AuthInitializer>
					<Routes>
						<Route
							path="/login"
							element={
								<RequireNoSetup>
									<LoginPage />
								</RequireNoSetup>
							}
						/>
						<Route
							path="/setup"
							element={
								<RequireSetupNeeded>
									<SetupPage />
								</RequireSetupNeeded>
							}
						/>
						<Route
							path="/"
							element={
								<ProtectedRoute>
									<App />
								</ProtectedRoute>
							}
						>
							<Route index element={<Navigate to="/ai-usage" replace />} />
							<Route path="ai-usage" element={<AiUsagePage />} />
							<Route path="ai-usage/:id" element={<AiUsageDetailPage />} />
							<Route path="system-prompts" element={<SystemPromptsPage />} />
							<Route path="system-prompts/:id" element={<SystemPromptDetailPage />} />
							<Route path="users" element={<UsersPage />} />
						</Route>
					</Routes>
				</AuthInitializer>
			</TooltipProvider>
		</BrowserRouter>
	</QueryClientProvider>,
);
