import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function BackButton() {
	const navigate = useNavigate();
	const location = useLocation();

	const handleBack = useCallback(() => {
		if (location.state?.internal) {
			navigate(-1);
		} else {
			navigate("/", { replace: true, state: { internal: true } });
		}
	}, [location.state?.internal, navigate]);

	return (
		<Button type="button" variant="ghost" size="icon" aria-label="Back" onClick={handleBack}>
			<ArrowLeft className="size-5" />
		</Button>
	);
}
