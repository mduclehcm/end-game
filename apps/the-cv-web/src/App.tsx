import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { NavigationLoadingBar, NavigationLoadingProvider } from "./components/navigation-loading-bar";
import { TooltipProvider } from "./components/ui/tooltip";
import { GlobalErrorBoundary } from "./pages/share/error.page";
import LoadingPage from "./pages/share/loading.page";

const LazyHomePage = lazy(() => import("./pages/home/home.page"));
const LazyMyResumesPage = lazy(() => import("./pages/my-resumes/my-resumes.page"));
const LazyBuilderPage = lazy(() => import("./pages/builder/builder.page"));

function RedirectDoc() {
	const { id } = useParams<{ id: string }>();
	return <Navigate to={`/doc/${id}`} replace />;
}

function App() {
	return (
		<GlobalErrorBoundary>
			<TooltipProvider>
				<NavigationLoadingProvider>
					<NavigationLoadingBar />
					<Suspense fallback={<LoadingPage />}>
						<Routes>
							<Route path="/" Component={LazyHomePage} />
							<Route path="/my-resumes" Component={LazyMyResumesPage} />
							<Route path="/doc/:id" Component={LazyBuilderPage} />
							<Route path="/c/:id" element={<RedirectDoc />} />
							<Route path="/r/:id" element={<RedirectDoc />} />
						</Routes>
					</Suspense>
				</NavigationLoadingProvider>
			</TooltipProvider>
		</GlobalErrorBoundary>
	);
}

export default App;
