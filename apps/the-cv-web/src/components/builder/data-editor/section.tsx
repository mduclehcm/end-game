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
	isDragging?: boolean;
	children?: (showMore: boolean) => React.ReactNode;
};

export function Section({ isDragging, title, description, hasAdvanceFields, draggable, children }: SectionProps) {
	const [isOpen, toggleIsOpen] = useToggle(true);
	const [showMore, toggleShowMore] = useToggle(false);
	const sortable = useContext(SortableHandleContext);

	return (
		<fieldset
			className={cn(
				"grid transition-[grid-template-rows] duration-200 gap-2 p-4 pl-8",
				isOpen && !isDragging ? "grid-rows-[auto_1fr]" : "grid-rows-[auto_0fr]",
			)}
		>
			<div
				role="button"
				tabIndex={0}
				className="relative flex-1 flex flex-col cursor-pointer gap-2"
				onClick={toggleIsOpen}
			>
				{draggable && (
					<Button
						variant="ghost"
						className="absolute left-0 top-0 -translate-x-full cursor-grab active:cursor-grabbing"
						{...sortable?.attributes}
						{...sortable?.listeners}
					>
						<GripVertical className="size-4" />
					</Button>
				)}
				<div className="text-xl font-medium">{title}</div>
				<FieldDescription>{description}</FieldDescription>
				<ChevronDownIcon
					className={cn("absolute right-0 top-2 size-4 transition-transform duration-200", isOpen ? "rotate-180" : "")}
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
		</fieldset>
	);
}
