import { FileDown } from "lucide-react";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { BackButton } from "@/components/header/back-button";
import { SaveIndicator } from "@/components/header/save-indicator";
import { ToggleDebugModeButton } from "@/components/header/toggle-debug-mode-button";
import { ToggleThemeButton } from "@/components/header/toggle-theme-button";
import { OfflineBanner } from "@/components/offline-banner";
import { Button } from "@/components/ui/button";
import { createExport } from "@/lib/api";
import { useBuilderStore } from "@/store";

export const BuilderHeader = () => {
	const title = useBuilderStore((state) => state.title);
	const { id: documentId } = useParams<{ id: string }>();
	const [exporting, setExporting] = useState(false);

	const handleExportPdf = useCallback(async () => {
		if (!documentId) return;
		setExporting(true);
		try {
			await createExport(documentId);
			toast.success("Export started", {
				description: "Your PDF will be ready shortly. Go to My exports to download.",
				action: {
					label: "Open exports",
					onClick: () => window.location.assign("/my-resumes/exports"),
				},
			});
		} catch (e) {
			toast.error("Export failed", {
				description: e instanceof Error ? e.message : "Could not start export",
			});
		} finally {
			setExporting(false);
		}
	}, [documentId]);

	return (
		<div className="bg-card border-b flex items-center justify-between p-3 px-3 z-999">
			<div className="flex gap-2 items-center">
				<BackButton />
				<h1>{title}</h1>
				<OfflineBanner />
				<SaveIndicator />
			</div>
			<div className="flex gap-2 items-center">
				{documentId && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportPdf}
						disabled={exporting}
						className="gap-1.5"
					>
						<FileDown className="size-4" />
						{exporting ? "Exporting…" : "Export PDF"}
					</Button>
				)}
				<ToggleDebugModeButton />
				<ToggleThemeButton />
			</div>
		</div>
	);
};
