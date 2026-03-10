import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import { queryClient } from "./lib/query-client";
import AiUsagePage from "./pages/ai-usage";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element not found");
}
createRoot(rootEl).render(
	<QueryClientProvider client={queryClient}>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />}>
					<Route index element={<AiUsagePage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	</QueryClientProvider>,
);
