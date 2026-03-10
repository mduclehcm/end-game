import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { SORTABLE_SECTION_KINDS } from "@/data/default-document-data";
import { useBuilderStore } from "@/store";
import { SortableSectionItem } from "./sortable-section-item";

export function SortableSectionList() {
	const sectionIds = useBuilderStore((state) => state.data.sectionIds);
	const sections = useBuilderStore((state) => state.data.sections);
	const reorderSectionIds = useBuilderStore((state) => state.reorderSectionIds);

	const sortableSectionIds = useMemo(() => {
		return sectionIds.filter((id) => {
			const s = sections.find((sec) => sec.id === id);
			return s && (SORTABLE_SECTION_KINDS as readonly string[]).includes(s.kind);
		});
	}, [sectionIds, sections]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			reorderSectionIds(active.id as string, over.id as string);
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis, restrictToParentElement]}
			onDragEnd={handleDragEnd}
		>
			<SortableContext items={sortableSectionIds} strategy={verticalListSortingStrategy}>
				{sortableSectionIds.map((sectionId) => (
					<SortableSectionItem key={sectionId} sectionId={sectionId} />
				))}
			</SortableContext>
		</DndContext>
	);
}
