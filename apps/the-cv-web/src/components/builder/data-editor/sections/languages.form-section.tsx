import { CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findSection, getOrderedEntities, useBuilderStore } from "@/store";
import { BuilderFieldInput } from "../input";
import { Section } from "../section";
import type { SectionProps } from "./share";

export function LanguagesFormSection({ sectionId, isDragging }: SectionProps) {
	const data = useBuilderStore((state) => state.data);
	const addArrayItem = useBuilderStore((state) => state.addArrayItem);
	const removeArrayItem = useBuilderStore((state) => state.removeArrayItem);
	const duplicateEntity = useBuilderStore((state) => state.duplicateEntity);

	const section = sectionId ? findSection(data, sectionId) : undefined;
	const entities = section ? getOrderedEntities(section) : [];

	return (
		<Section
			name="languages"
			title="Languages"
			description="List the languages you speak and your level of proficiency for each."
			draggable
			isDragging={isDragging}
		>
			{() => (
				<>
					{entities.map((entity, index) => (
						<div key={entity.id} className="col-span-2 flex items-center gap-2">
							{entity.fields.map((field) => (
								<BuilderFieldInput
									key={field.id}
									className="flex-1"
									name={`${field.id}-${index}`}
									label={index === 0 ? field.label : ""}
									field={field.id}
									placeholder={field.placeholder}
								/>
							))}
							<div className={`flex items-center gap-0.5 ${index === 0 ? "mt-6" : ""}`}>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label={`Duplicate language ${index + 1}`}
									onClick={() => duplicateEntity(entity.id)}
								>
									<CopyIcon className="size-3.5" />
								</Button>
								{entities.length > 1 && sectionId && (
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										aria-label={`Remove language ${index + 1}`}
										onClick={() => removeArrayItem(sectionId, index)}
									>
										<Trash2Icon className="size-3.5" />
									</Button>
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
							Add language
						</Button>
					)}
				</>
			)}
		</Section>
	);
}
