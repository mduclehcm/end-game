import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { ChevronDownIcon, ChevronsDownIcon, GripVertical } from "lucide-react";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { useToggle } from "@/hooks/use-toggle";
import { cn } from "@/lib/utils";

interface SortableContextValue {
	attributes: React.HTMLAttributes<HTMLElement>;
	listeners: SyntheticListenerMap | undefined;
}

export const SortableHandleContext = createContext<SortableContextValue | null>(null);

type SectionProps = {
	name: string;
	title: string;
	description: string;
	hasAdvanceFields?: boolean;
	draggable?: boolean;
	children?: (showMore: boolean) => React.ReactNode;
};

export function Section({ name, title, description, hasAdvanceFields, draggable, children }: SectionProps) {
	const [isOpen, toggleIsOpen] = useToggle(true);
	const [showMore, toggleShowMore] = useToggle(false);
	const sortable = useContext(SortableHandleContext);

	return (
		<fieldset name={name} className="flex justify-start items-start">
			{/* drag handle */}
			<div className="shrink-0 flex items-center justify-center w-12">
				{draggable && (
					<Button
						variant="ghost"
						size="sm"
						className="m-1 cursor-grab active:cursor-grabbing"
						{...sortable?.attributes}
						{...sortable?.listeners}
					>
						<GripVertical className="size-5" />
					</Button>
				)}
			</div>

			{/* section content */}
			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-200 gap-2",
					isOpen ? "grid-rows-[auto_1fr]" : "grid-rows-[auto_0fr]",
				)}
			>
				<div
					role="button"
					tabIndex={0}
					className="relative flex-1 flex flex-col cursor-pointer gap-2"
					onClick={toggleIsOpen}
				>
					<div className="text-xl font-medium mt-[6px]">{title}</div>
					<FieldDescription>{description}</FieldDescription>
					<ChevronDownIcon
						className={cn(
							"absolute right-0 top-2 size-4 transition-transform duration-200",
							isOpen ? "rotate-180" : "",
						)}
					/>
				</div>
				<div className="min-h-0 overflow-hidden grid grid-cols-2 gap-4">
					{children?.(showMore)}
					{hasAdvanceFields && (
						<Button className="col-span-2 justify-center mb-4" variant="link" size="xs" onClick={toggleShowMore}>
							<ChevronsDownIcon
								className={cn("size-4 transition-transform duration-200", showMore ? "rotate-180" : "")}
							/>
							{showMore ? "Hide advanced fields" : "Show advanced fields"}
						</Button>
					)}
				</div>
			</div>
		</fieldset>
	);
}
