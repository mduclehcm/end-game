import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import { queryClient } from "./lib/query-client";
import AiUsagePage from "./pages/ai-usage";
import AiUsageDetailPage from "./pages/ai-usage/detail";
import SystemPromptsPage from "./pages/system-prompts";
import SystemPromptDetailPage from "./pages/system-prompts/detail";
import "./index.css";
import { TooltipProvider } from "./components/ui/tooltip";

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element not found");
}
createRoot(rootEl).render(
	<QueryClientProvider client={queryClient}>
		<BrowserRouter>
			<TooltipProvider>
				<Routes>
					<Route path="/" element={<App />}>
						<Route index element={<AiUsagePage />} />
						<Route path="ai-usage" element={<AiUsagePage />} />
						<Route path="ai-usage/:id" element={<AiUsageDetailPage />} />
						<Route path="system-prompts" element={<SystemPromptsPage />} />
						<Route path="system-prompts/:id" element={<SystemPromptDetailPage />} />
					</Route>
				</Routes>
			</TooltipProvider>
		</BrowserRouter>
	</QueryClientProvider>,
);
