import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getArrayIndices, useBuilderStore } from "@/store";
import { BuilderFieldInput } from "../input";
import { Section } from "../section";

export function ProfessionalExperienceFormSection() {
	const fields = useBuilderStore((state) => state.fields);
	const addArrayItem = useBuilderStore((state) => state.addArrayItem);
	const removeArrayItem = useBuilderStore((state) => state.removeArrayItem);

	const indices = useMemo(() => getArrayIndices(fields, "experience"), [fields]);

	return (
		<Section
			name="professional-experience"
			title="Professional Experience"
			description="Show your relevant experience (last 10 years). Use bullet points to note your achievements, if possible - use numbers/facts (Achieved X, measured by Y, by doing Z)."
			draggable
		>
			{() => (
				<>
					{indices.map((index) => (
						<div key={index} className="col-span-2 flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-muted-foreground">Experience #{index + 1}</span>
								{indices.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										aria-label={`Remove experience ${index + 1}`}
										onClick={() => removeArrayItem("experience", index)}
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
									field={`experience.${index}.position`}
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`employer-${index}`}
									label="Employer"
									field={`experience.${index}.company`}
								/>
								<BuilderFieldInput
									name={`start-date-${index}`}
									label="Start Date"
									field={`experience.${index}.startDate`}
									placeholder="YYYY-MM-DD"
								/>
								<BuilderFieldInput
									name={`end-date-${index}`}
									label="End Date"
									field={`experience.${index}.endDate`}
									placeholder="YYYY-MM-DD"
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`city-state-${index}`}
									label="City, State"
									field={`experience.${index}.location`}
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`description-${index}`}
									label="Description"
									field={`experience.${index}.description`}
								/>
							</div>
						</div>
					))}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="col-span-2 gap-1.5"
						onClick={() => addArrayItem("experience")}
					>
						<PlusIcon className="size-3.5" />
						Add experience
					</Button>
				</>
			)}
		</Section>
	);
}
