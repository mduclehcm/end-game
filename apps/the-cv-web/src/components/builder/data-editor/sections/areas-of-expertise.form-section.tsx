import { Section } from "../section";
import type { SectionProps } from "./share";

export function AreasOfExpertiseFormSection({ isDragging }: SectionProps) {
	return (
		<Section
			name="Areas of Expertise"
			title="Areas of Expertise"
			description="Choose 5 important skills that show you fit the position. Make sure they match the key skills mentioned in the job listing (especially when applying via an online system)."
			draggable
			isDragging={isDragging}
		/>
	);
}
