import { useEffect, useState } from "react";
import type { FragmentTree } from "@/core/layout";
import { useBuilderStore } from "@/store";
import { runLayoutPipeline } from "../lib/run-layout-pipeline";

export function useFragmentTree(): { fragmentTree: FragmentTree | null; loading: boolean } {
	const data = useBuilderStore((state) => state.data);
	const [fragmentTree, setFragmentTree] = useState<FragmentTree | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		runLayoutPipeline(data)
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
	}, [data]);

	return { fragmentTree, loading };
}
