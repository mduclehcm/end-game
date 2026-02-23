import { ChevronDownIcon, ChevronsDownIcon } from "lucide-react";
import { FieldDescription, FieldLegend } from "@/components/ui/field";
import { useToggle } from "@/hooks/use-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SectionProps = {
  name: string;
  title: string;
  description: string;
  hasAdvanceFields?: boolean;
  children: (showMore: boolean) => React.ReactNode;
};

export function Section({
  name,
  title,
  description,
  hasAdvanceFields,
  children,
}: SectionProps) {
  const [isOpen, toggleIsOpen] = useToggle(true);
  const [showMore, toggleShowMore] = useToggle(false);

  return (
    <fieldset
      name={name}
      className={cn(
        "grid transition-[grid-template-rows] duration-200 gap-4 pl-9",
        isOpen ? "grid-rows-[auto_1fr]" : "grid-rows-[auto_0fr]",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        className="relative flex-1 flex flex-col gap-1 cursor-pointer"
        onClick={toggleIsOpen}
      >
        <FieldLegend>{title}</FieldLegend>
        <FieldDescription>{description}</FieldDescription>
        {isOpen && (
          <ChevronDownIcon
            className={cn(
              "absolute right-0 top-0 size-4 transition-transform duration-200",
              isOpen ? "rotate-180" : "",
            )}
          />
        )}
      </div>
      <div className="min-h-0 overflow-hidden grid grid-cols-2 gap-4 pr-4">
        {children && children(showMore)}
      </div>
      {hasAdvanceFields && (
        <Button
          className="w-full justify-end mb-4"
          variant="ghost"
          size="xs"
          onClick={toggleShowMore}
        >
          <ChevronsDownIcon
            className={cn("size-4", showMore ? "rotate-180" : "")}
          />
          {showMore ? "Hide advanced fields" : "Show advanced fields"}
        </Button>
      )}
    </fieldset>
  );
}
