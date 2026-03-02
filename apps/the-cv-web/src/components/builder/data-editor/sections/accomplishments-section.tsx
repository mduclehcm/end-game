import { Section } from "../section";
import type { SectionProps } from "./share";

export function AccomplishmentsFormSection({ isDragging }: SectionProps) {
	return (
		<Section
			name="accomplishments"
			title="Accomplishments"
			description="List your biggest accomplishments, achievements, and awards."
			draggable
			isDragging={isDragging}
		/>
	);
}
