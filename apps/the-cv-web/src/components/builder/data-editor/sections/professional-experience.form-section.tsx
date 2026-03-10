import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldPath } from "@/core/layout/document-view";
import { findSection, getOrderedEntities, useBuilderStore } from "@/store";
import { BuilderFieldInput, BuilderRichTextInput } from "../input";
import { Section } from "../section";
import type { SectionProps } from "./share";

export function ProfessionalExperienceFormSection({ sectionId, isDragging }: SectionProps) {
	const data = useBuilderStore((state) => state.data);
	const addArrayItem = useBuilderStore((state) => state.addArrayItem);
	const removeArrayItem = useBuilderStore((state) => state.removeArrayItem);
	const duplicateEntity = useBuilderStore((state) => state.duplicateEntity);

	const section = sectionId ? findSection(data, sectionId) : undefined;
	const entities = section ? getOrderedEntities(section) : [];

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
					{entities.map((entity, index) => (
						<div
							key={entity.id}
							className="col-span-2 flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-muted-foreground">Experience #{index + 1}</span>
								{sectionId && (
									<div className="flex items-center gap-0.5">
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											aria-label={`Duplicate experience ${index + 1}`}
											onClick={() => duplicateEntity(entity.id)}
										>
											<CopyIcon className="size-3.5" />
										</Button>
										{entities.length > 1 && (
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
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								{entity.fields.map((field) =>
									field.type === "richtext" ? (
										<BuilderRichTextInput
											key={field.id}
											className="col-span-2"
											name={`${field.id}-${index}`}
											label={field.label}
											field={field.id}
											placeholder={field.placeholder}
											dataKey={section ? fieldPath(section, index, field.key ?? field.id) : undefined}
											rewriteContext={
												section
													? {
															sectionId: section.id,
															entityId: entity.id,
															sectionKind: section.kind,
															fieldKey: field.key ?? "description",
														}
													: undefined
											}
										/>
									) : (
										<BuilderFieldInput
											key={field.id}
											className={field.colSpan === 2 ? "col-span-2" : undefined}
											name={`${field.id}-${index}`}
											label={field.label}
											field={field.id}
											placeholder={field.placeholder}
											dataKey={section ? fieldPath(section, index, field.key ?? field.id) : undefined}
										/>
									),
								)}
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
