import { FieldGroup } from "@/components/ui/field";
import { AnimatedSection } from "./animated-section";
import { PersonalDetailsFormSection, ProfessionalSummaryFormSection } from "./sections";

export function StaticSections() {
	return (
		<>
			<FieldGroup className="bg-card rounded-xl">
				<AnimatedSection index={0}>
					<PersonalDetailsFormSection />
				</AnimatedSection>
			</FieldGroup>
			<FieldGroup className="bg-card rounded-xl">
				<AnimatedSection index={1}>
					<ProfessionalSummaryFormSection />
				</AnimatedSection>
			</FieldGroup>
		</>
	);
}
