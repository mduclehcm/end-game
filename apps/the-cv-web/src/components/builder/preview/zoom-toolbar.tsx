import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

interface ZoomToolbarProps {
	zoom: number;
	onZoomChange: (zoom: number) => void;
	onFitWidth: () => void;
	fitWidthActive?: boolean;
	className?: string;
}

export const ZoomToolbar = memo(
	({ zoom, onZoomChange, onFitWidth, fitWidthActive = false, className }: ZoomToolbarProps) => {
		const canZoomIn = zoom < MAX_ZOOM;
		const canZoomOut = zoom > MIN_ZOOM;

		return (
			<div
				className={cn(
					"flex items-center gap-1 rounded-md border bg-background/95 px-1 py-0.5 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80",
					className,
				)}
				role="toolbar"
				aria-label="Preview zoom controls"
			>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
					disabled={!canZoomOut}
					aria-label="Zoom out"
				>
					<ZoomOut className="size-3.5" />
				</Button>
				<span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
					{Math.round(zoom * 100)}%
				</span>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
					disabled={!canZoomIn}
					aria-label="Zoom in"
				>
					<ZoomIn className="size-3.5" />
				</Button>
				<div className="mx-0.5 h-4 w-px bg-border" />
				<Button
					variant={fitWidthActive ? "secondary" : "ghost"}
					size="icon-xs"
					onClick={onFitWidth}
					aria-label="Fit width"
					aria-pressed={fitWidthActive}
				>
					<Maximize2 className="size-3.5" />
				</Button>
			</div>
		);
	},
);

ZoomToolbar.displayName = "ZoomToolbar";

export { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP };
