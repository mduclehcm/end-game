import { SortableSectionList } from "./sortable-section-list";
import { StaticSections } from "./static-sections";

export function DataEditor() {
	return (
		<div className="p-2 pr-0 grid gap-2">
			<StaticSections />
			<SortableSectionList />
		</div>
	);
}
