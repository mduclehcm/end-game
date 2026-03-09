import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FieldGroup } from "@/components/ui/field";
import { useBuilderStore } from "@/store";
import { SortableHandleContext } from "./section";
import {
	AreasOfExpertiseFormSection,
	EducationFormSection,
	ProfessionalExperienceFormSection,
	TechnicalProficienciesFormSection,
} from "./sections";
import type { SectionProps } from "./sections/share";

const sectionComponentMap: Record<string, React.FC<SectionProps>> = {
	experience: ProfessionalExperienceFormSection,
	education: EducationFormSection,
	skills: AreasOfExpertiseFormSection,
	settings: TechnicalProficienciesFormSection,
};

export type SortableSectionItemProps = {
	sectionId: string;
};

export function SortableSectionItem({ sectionId }: SortableSectionItemProps) {
	const kind = useBuilderStore((state) => {
		const section = state.data.sections.find((s) => s.id === sectionId);
		return section?.kind;
	});
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: sectionId,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : undefined,
		position: "relative",
		opacity: isDragging ? 0.8 : 1,
	};

	const Component = kind ? sectionComponentMap[kind] : undefined;
	if (!Component) return null;

	return (
		<div ref={setNodeRef} style={style}>
			<SortableHandleContext.Provider value={{ attributes, listeners }}>
				<FieldGroup className="bg-card rounded-xl">
					<Component sectionId={sectionId} isDragging={isDragging} />
				</FieldGroup>
			</SortableHandleContext.Provider>
		</div>
	);
}
