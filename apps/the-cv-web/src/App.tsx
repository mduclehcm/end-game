import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { NavigationLoadingBar, NavigationLoadingProvider } from "./components/navigation-loading-bar";
import { ProtectedRoute } from "./components/protected-route";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { GlobalErrorBoundary } from "./pages/share/error.page";
import LoadingPage from "./pages/share/loading.page";

const LazyHomePage = lazy(() => import("./pages/home/home.page"));
const LazySignInPage = lazy(() => import("./pages/sign-in/sign-in.page"));
const LazyMyResumesPage = lazy(() => import("./pages/my-resumes/my-resumes.page"));
const LazyExportsPage = lazy(() => import("./pages/my-resumes/exports.page"));
const LazyBuilderPage = lazy(() => import("./pages/builder/builder.page"));

function App() {
	return (
		<GlobalErrorBoundary>
			<TooltipProvider>
				<Toaster />
				<NavigationLoadingProvider>
					<NavigationLoadingBar />
					<Suspense fallback={<LoadingPage />}>
						<Routes>
							<Route path="/" Component={LazyHomePage} />
							<Route path="/sign-in" Component={LazySignInPage} />
							<Route
								path="/my-resumes"
								element={
									<ProtectedRoute>
										<Suspense fallback={<LoadingPage />}>
											<LazyMyResumesPage />
										</Suspense>
									</ProtectedRoute>
								}
							/>
							<Route
								path="/my-resumes/exports"
								element={
									<ProtectedRoute>
										<Suspense fallback={<LoadingPage />}>
											<LazyExportsPage />
										</Suspense>
									</ProtectedRoute>
								}
							/>
							<Route
								path="/doc/:id"
								element={
									<ProtectedRoute>
										<Suspense fallback={<LoadingPage />}>
											<LazyBuilderPage />
										</Suspense>
									</ProtectedRoute>
								}
							/>
						</Routes>
					</Suspense>
				</NavigationLoadingProvider>
			</TooltipProvider>
		</GlobalErrorBoundary>
	);
}

export default App;
