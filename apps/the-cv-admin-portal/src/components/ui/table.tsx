import type * as React from "react";
import { cn } from "@/lib/utils";

const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
	<div className="relative w-full overflow-auto">
		<table className={cn("w-full caption-bottom text-sm", className)} {...props} />
	</div>
);

const TableHeader = ({ className, ...props }: React.ComponentProps<"thead">) => (
	<thead className={cn("[&_tr]:border-b", className)} {...props} />
);

const TableBody = ({ className, ...props }: React.ComponentProps<"tbody">) => (
	<tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

const TableRow = ({ className, ...props }: React.ComponentProps<"tr">) => (
	<tr
		className={cn(
			"border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
			className,
		)}
		{...props}
	/>
);

const TableHead = ({ className, ...props }: React.ComponentProps<"th">) => (
	<th
		className={cn(
			"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
			className,
		)}
		{...props}
	/>
);

const TableCell = ({ className, ...props }: React.ComponentProps<"td">) => (
	<td
		className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
		{...props}
	/>
);

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
