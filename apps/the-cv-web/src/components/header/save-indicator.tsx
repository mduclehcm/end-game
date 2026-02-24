import { CheckIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useBuilderStore } from "@/store";

export const SaveIndicator = () => {
	const saveStatus = useBuilderStore((state) => state.saveStatus);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (saveStatus === "idle") {
			setVisible(false);
			return;
		}

		setVisible(true);

		if (saveStatus === "saved") {
			const timer = setTimeout(() => setVisible(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [saveStatus]);

	if (!visible) return null;

	return (
		<span className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in">
			{saveStatus === "saving" && (
				<>
					<Loader2Icon className="size-3 animate-spin" />
					Saving...
				</>
			)}
			{saveStatus === "saved" && (
				<>
					<CheckIcon className="size-3" />
					Saved
				</>
			)}
		</span>
	);
};
