import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getArrayIndices, useBuilderStore } from "@/store";
import { BuilderFieldInput } from "../input";
import { Section } from "../section";
import type { SectionProps } from "./share";

export function EducationFormSection({ isDragging }: SectionProps) {
	const fields = useBuilderStore((state) => state.fields);
	const addArrayItem = useBuilderStore((state) => state.addArrayItem);
	const removeArrayItem = useBuilderStore((state) => state.removeArrayItem);

	const indices = useMemo(() => getArrayIndices(fields, "education"), [fields]);

	return (
		<Section
			name="education"
			title="Education"
			description="A varied education on your resume sums up the value that your learnings and background will bring to job."
			draggable
			isDragging={isDragging}
		>
			{() => (
				<>
					{indices.map((index) => (
						<div key={index} className="col-span-2 flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-muted-foreground">Education #{index + 1}</span>
								{indices.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										aria-label={`Remove education ${index + 1}`}
										onClick={() => removeArrayItem("education", index)}
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<BuilderFieldInput
									className="col-span-2"
									name={`school-${index}`}
									label="School"
									field={`education.${index}.institution`}
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`degree-${index}`}
									label="Degree"
									field={`education.${index}.degree`}
								/>
								<BuilderFieldInput
									name={`start-date-${index}`}
									label="Start Date"
									field={`education.${index}.startDate`}
									placeholder="YYYY-MM-DD"
								/>
								<BuilderFieldInput
									name={`end-date-${index}`}
									label="End Date"
									field={`education.${index}.endDate`}
									placeholder="YYYY-MM-DD"
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`city-${index}`}
									label="City"
									field={`education.${index}.city`}
								/>
								<BuilderFieldInput
									className="col-span-2"
									name={`description-${index}`}
									label="Description"
									field={`education.${index}.description`}
								/>
							</div>
						</div>
					))}
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="col-span-2 gap-1.5"
						onClick={() => addArrayItem("education")}
					>
						<PlusIcon className="size-3.5" />
						Add education
					</Button>
				</>
			)}
		</Section>
	);
}
