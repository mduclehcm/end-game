import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { GlobalErrorBoundary } from "./pages/share/error.page";
import LoadingPage from "./pages/share/loading.page";

const LazyHomePage = lazy(() => import("./pages/home/home.page"));
const LazyMyResumesPage = lazy(() => import("./pages/my-resumes/my-resumes.page"));
const LazyBuilderPage = lazy(() => import("./pages/builder/builder.page"));

function App() {
	return (
		<GlobalErrorBoundary>
			<Suspense fallback={<LoadingPage />}>
				<Routes>
					<Route path="/" Component={LazyHomePage} />
					<Route path="/my-resumes" Component={LazyMyResumesPage} />
					<Route path="/resumes/:id" Component={LazyBuilderPage} />
				</Routes>
			</Suspense>
		</GlobalErrorBoundary>
	);
}

export default App;
