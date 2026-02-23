import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { queryClient } from "./lib/query-client";
import "./index.css";
const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element not found");
}
createRoot(rootEl).render(
	<QueryClientProvider client={queryClient}>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</QueryClientProvider>,
);
