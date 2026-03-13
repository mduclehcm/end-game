import { useEffect, useRef, useState } from "react";
import type { FragmentTree } from "@algo/cv-layout";
import { useBuilderStore } from "@/store";
import { runLayoutPipeline } from "../lib/run-layout-pipeline";

/**
 * @param measureRoot - When set, text is measured in this element's font context (e.g. preview container) so widths match and contact text is not clipped.
 */
export function useFragmentTree(measureRoot?: HTMLElement | null): {
	fragmentTree: FragmentTree | null;
	loading: boolean;
} {
	const data = useBuilderStore((state) => state.data);
	const [fragmentTree, setFragmentTree] = useState<FragmentTree | null>(null);
	const [loading, setLoading] = useState(true);
	const fragmentTreeRef = useRef<FragmentTree | null>(null);
	fragmentTreeRef.current = fragmentTree;

	useEffect(() => {
		let cancelled = false;
		// Only show loading when we have no tree yet (avoid unmounting content when re-running for measureRoot)
		if (fragmentTreeRef.current == null) setLoading(true);
		runLayoutPipeline(data, undefined, measureRoot)
			.then((tree) => {
				if (!cancelled) {
					setFragmentTree(tree);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					console.error("[useFragmentTree] Layout pipeline failed:", err);
					setFragmentTree(null);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [data, measureRoot]);

	return { fragmentTree, loading };
}
