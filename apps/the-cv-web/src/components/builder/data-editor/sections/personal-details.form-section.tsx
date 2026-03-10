import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { fieldPath } from "@/core/layout/document-view";
import { getOrderedEntities, useBuilderStore } from "@/store";
import { BuilderFieldInput } from "../input";
import { Section } from "../section";

export function PersonalDetailsFormSection() {
	const data = useBuilderStore((state) => state.data);

	const section = useMemo(() => data.sections.find((s) => s.kind === "personal"), [data.sections]);
	const entity = section ? getOrderedEntities(section)[0] : undefined;
	const fields = entity?.fields ?? [];

	return (
		<Section
			name="personal-details"
			title="Personal Details"
			description="Users who added phone number and email received 64% more positive feedback from recruiters."
			hasAdvanceFields
			draggable={false}
		>
			{(showMore) => (
				<>
					{fields.slice(0, showMore ? undefined : 9).map((field, i) => (
						<BuilderFieldInput
							key={field.id}
							className={cn(field.colSpan === 2 && "col-span-2", i === 0 && "mt-2")}
							name={field.id}
							label={field.label}
							field={field.id}
							placeholder={field.placeholder}
							dataKey={section ? fieldPath(section, 0, field.key ?? field.id) : undefined}
						/>
					))}
				</>
			)}
		</Section>
	);
}
