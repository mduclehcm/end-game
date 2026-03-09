import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getArrayIndices, useBuilderStore } from "@/store";
import { BuilderFieldInput, BuilderRichTextInput } from "../input";
import { Section } from "../section";
import type { SectionProps } from "./share";

export function ProfessionalExperienceFormSection({ sectionId, isDragging }: SectionProps) {
	const fields = useBuilderStore((state) => state.data.fieldValues);
	const sections = useBuilderStore((state) => state.data.sections);
	const addArrayItem = useBuilderStore((state) => state.addArrayItem);
	const removeArrayItem = useBuilderStore((state) => state.removeArrayItem);

	const indices = useMemo(
		() => (sectionId ? getArrayIndices(fields, sectionId, sections) : [0]),
		[fields, sectionId, sections],
	);

	return (
		<Section
			name="professional-experience"
			title="Professional Experience"
			description="Show your relevant experience (last 10 years). Use bullet points to note your achievements, if possible - use numbers/facts (Achieved X, measured by Y, by doing Z)."
			draggable
			isDragging={isDragging}
		>
			{() => (
				<>
					{indices.map((index) => (
						<div key={index} className="col-span-2 flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-muted-foreground">Experience #{index + 1}</span>
								{indices.length > 1 && sectionId && (
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										aria-label={`Remove experience ${index + 1}`}
										onClick={() => removeArrayItem(sectionId, index)}
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<BuilderFieldInput
									className="col-span-2"
									name={`job-title-${index}`}
									label="Job Title"
									field={`content.experience.${index}.position`}
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`employer-${index}`}
									label="Employer"
									field={`content.experience.${index}.company`}
								/>
								<BuilderFieldInput
									name={`start-date-${index}`}
									label="Start Date"
									field={`content.experience.${index}.startDate`}
									placeholder="YYYY-MM-DD"
								/>
								<BuilderFieldInput
									name={`end-date-${index}`}
									label="End Date"
									field={`content.experience.${index}.endDate`}
									placeholder="YYYY-MM-DD"
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`city-state-${index}`}
									label="City, State"
									field={`content.experience.${index}.location`}
								/>
								<BuilderRichTextInput
									className="col-span-2"
									name={`description-${index}`}
									label="Description"
									field={`content.experience.${index}.description`}
									placeholder="Bullet points, achievements, tech stack…"
								/>
							</div>
						</div>
					))}
					{sectionId && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="col-span-2 gap-1.5"
							onClick={() => addArrayItem(sectionId)}
						>
							<PlusIcon className="size-3.5" />
							Add experience
						</Button>
					)}
				</>
			)}
		</Section>
	);
}
