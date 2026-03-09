import { FragmentTreeRenderer } from "@/components/builder/preview/components/fragment-tree-renderer";
import { useFragmentTree } from "@/components/builder/preview/hooks/use-fragment-tree";
import { Spinner } from "@/components/ui/spinner";

export const PreviewPanel = () => {
	const { fragmentTree, loading } = useFragmentTree();

	if (loading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="flex-1 h-full relative overflow-auto">
			<FragmentTreeRenderer fragmentTree={fragmentTree} />
		</div>
	);
};
