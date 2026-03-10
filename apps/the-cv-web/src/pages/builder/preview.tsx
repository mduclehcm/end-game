import { useCallback, useState } from "react";
import { FragmentTreeRenderer } from "@/components/builder/preview/components/fragment-tree-renderer";
import { useFragmentTree } from "@/components/builder/preview/hooks/use-fragment-tree";
import { Spinner } from "@/components/ui/spinner";

export const PreviewPanel = () => {
	const [measureRoot, setMeasureRoot] = useState<HTMLElement | null>(null);
	const onFirstPageContentMounted = useCallback((el: HTMLElement | null) => {
		setMeasureRoot(el);
	}, []);
	const { fragmentTree, loading } = useFragmentTree(measureRoot);

	return (
		<div className="flex-1 h-full relative overflow-auto">
			{loading ? (
				<div className="flex h-full w-full items-center justify-center">
					<Spinner />
				</div>
			) : (
				<FragmentTreeRenderer fragmentTree={fragmentTree} onFirstPageContentMounted={onFirstPageContentMounted} />
			)}
		</div>
	);
};
