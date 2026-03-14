import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuthStore();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}
