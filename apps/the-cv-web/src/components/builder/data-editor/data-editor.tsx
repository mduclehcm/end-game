import type { DocumentSection } from "@algo/cv-core";
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
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldGroup } from "@/components/ui/field";
import { useBuilderStore } from "@/store";
import { AnimatedSection } from "./animated-section";
import { SortableHandleContext } from "./section";
import {
	AreasOfExpertiseFormSection,
	EducationFormSection,
	PersonalDetailsFormSection,
	ProfessionalExperienceFormSection,
	ProfessionalSummaryFormSection,
	TechnicalProficienciesFormSection,
} from "./sections";

const sectionComponentMap: Record<string, React.FC> = {
	experience: ProfessionalExperienceFormSection,
	education: EducationFormSection,
	skills: AreasOfExpertiseFormSection,
	settings: TechnicalProficienciesFormSection,
};

function SortableItem({ section }: { section: DocumentSection }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: section.kind,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : undefined,
		position: "relative",
		opacity: isDragging ? 0.8 : 1,
	};

	const Component = sectionComponentMap[section.kind];
	if (!Component) return null;

	return (
		<div ref={setNodeRef} style={style}>
			<FieldGroup className="bg-card rounded-xl py-2 pr-4">
				<SortableHandleContext.Provider value={{ attributes, listeners }}>
					<Component />
				</SortableHandleContext.Provider>
			</FieldGroup>
		</div>
	);
}

export function DataEditor() {
	const sections = useBuilderStore((state) => state.sections);
	const reorderSections = useBuilderStore((state) => state.reorderSections);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			reorderSections(active.id as string, over.id as string);
		}
	};

	return (
		<div className="p-2 pr-0 grid gap-2">
			<FieldGroup className="bg-card rounded-xl py-2 pr-4">
				<AnimatedSection index={0}>
					<PersonalDetailsFormSection />
				</AnimatedSection>
			</FieldGroup>
			<FieldGroup className="bg-card rounded-xl py-2 pr-4">
				<AnimatedSection index={1}>
					<ProfessionalSummaryFormSection />
				</AnimatedSection>
			</FieldGroup>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToVerticalAxis, restrictToParentElement]}
				onDragEnd={handleDragEnd}
			>
				<SortableContext items={sections.map((s) => s.kind)} strategy={verticalListSortingStrategy}>
					{sections.map((section) => (
						<SortableItem key={section.kind} section={section} />
					))}
				</SortableContext>
			</DndContext>
		</div>
	);
}
