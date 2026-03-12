import { Navigate, useLocation } from "react-router-dom";
import LoadingPage from "@/pages/share/loading.page";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuthStore();
	const location = useLocation();

	if (isLoading) {
		return <LoadingPage />;
	}

	if (!isAuthenticated) {
		const redirect = encodeURIComponent(location.pathname + location.search);
		return <Navigate to={`/sign-in?redirect=${redirect}`} replace />;
	}

	return <>{children}</>;
}
