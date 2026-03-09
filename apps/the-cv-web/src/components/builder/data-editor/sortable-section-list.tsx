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
import { useBuilderStore } from "@/store";
import { SortableSectionItem } from "./sortable-section-item";

export function SortableSectionList() {
	const sectionIds = useBuilderStore((state) => state.data.sectionIds);
	const reorderSectionIds = useBuilderStore((state) => state.reorderSectionIds);

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
			<SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
				{sectionIds.map((sectionId) => (
					<SortableSectionItem key={sectionId} sectionId={sectionId} />
				))}
			</SortableContext>
		</DndContext>
	);
}
