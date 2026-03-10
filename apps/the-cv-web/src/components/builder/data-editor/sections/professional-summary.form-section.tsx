import { useMemo } from "react";
import { fieldPath } from "@/core/layout/document-view";
import { getOrderedEntities, useBuilderStore } from "@/store";
import { BuilderRichTextInput } from "../input";
import { Section } from "../section";

export function ProfessionalSummaryFormSection() {
	const data = useBuilderStore((state) => state.data);

	const section = useMemo(() => data.sections.find((s) => s.kind === "summary"), [data.sections]);
	const entity = section ? getOrderedEntities(section)[0] : undefined;
	const textField = entity?.fields.find((f) => f.key === "text") ?? entity?.fields[0];

	return (
		<Section
			name="professional-summary"
			title="Professional Summary"
			description="Write 2-4 short, energetic sentences about how great you are. Mention the role and what you did. What were the big achievements? Describe your motivation and list your skills."
			draggable={false}
		>
			{() =>
				textField && section && entity ? (
					<BuilderRichTextInput
						className="col-span-2 my-4"
						name="professional-summary"
						label="Professional Summary"
						placeholder="e.g. Senior engineer with 10+ years…"
						field={textField.id}
						dataKey={fieldPath(section, 0, textField.key ?? textField.id)}
						rewriteContext={{
							sectionId: section.id,
							entityId: entity.id,
							sectionKind: section.kind,
							fieldKey: textField.key ?? "text",
						}}
					/>
				) : null
			}
		</Section>
	);
}
