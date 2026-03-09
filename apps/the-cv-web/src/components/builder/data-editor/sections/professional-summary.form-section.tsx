import { BuilderRichTextInput } from "../input";
import { Section } from "../section";

export function ProfessionalSummaryFormSection() {
	return (
		<Section
			name="professional-summary"
			title="Professional Summary"
			description="Write 2-4 short, energetic sentences about how great you are. Mention the role and what you did. What were the big achievements? Describe your motivation and list your skills."
			draggable={false}
		>
			{() => (
				<BuilderRichTextInput
					className="col-span-2 my-2"
					name="professional-summary"
					label="Professional Summary"
					placeholder="e.g. Senior engineer with 10+ years…"
					field="content.summary.text"
				/>
			)}
		</Section>
	);
}
