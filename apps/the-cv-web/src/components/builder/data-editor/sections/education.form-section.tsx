import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldPath } from "@/core/layout/document-view";
import { findSection, getOrderedEntities, useBuilderStore } from "@/store";
import { BuilderFieldInput, BuilderRichTextInput } from "../input";
import { Section } from "../section";
import type { SectionProps } from "./share";

export function EducationFormSection({ sectionId, isDragging }: SectionProps) {
	const data = useBuilderStore((state) => state.data);
	const addArrayItem = useBuilderStore((state) => state.addArrayItem);
	const removeArrayItem = useBuilderStore((state) => state.removeArrayItem);
	const duplicateEntity = useBuilderStore((state) => state.duplicateEntity);

	const section = sectionId ? findSection(data, sectionId) : undefined;
	const entities = section ? getOrderedEntities(section) : [];

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
					{entities.map((entity, index) => (
						<div
							key={entity.id}
							className="col-span-2 flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-muted-foreground">Education #{index + 1}</span>
								{sectionId && (
									<div className="flex items-center gap-0.5">
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											aria-label={`Duplicate education ${index + 1}`}
											onClick={() => duplicateEntity(entity.id)}
										>
											<CopyIcon className="size-3.5" />
										</Button>
										{entities.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon-xs"
												aria-label={`Remove education ${index + 1}`}
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
							Add education
						</Button>
					)}
				</>
			)}
		</Section>
	);
}
