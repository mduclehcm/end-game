"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MAX_STRING_LENGTH = 80;

function truncate(value: string): string {
	if (value.length <= MAX_STRING_LENGTH) return value;
	return `${value.slice(0, MAX_STRING_LENGTH)}…`;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
	return typeof x === "object" && x !== null && !Array.isArray(x);
}

interface JsonTreeProps {
	data: unknown;
	depth?: number;
	label?: string;
	className?: string;
}

export function JsonTree({ data, depth = 0, label, className }: JsonTreeProps) {
	const [expanded, setExpanded] = useState(true);
	const indent = depth * 12;

	if (data === null) {
		return (
			<div className={cn("font-mono text-xs text-muted-foreground", className)} style={{ paddingLeft: indent }}>
				{label ? `${label}: ` : ""}null
			</div>
		);
	}

	if (typeof data === "boolean" || typeof data === "number") {
		return (
			<div className={cn("font-mono text-xs text-muted-foreground", className)} style={{ paddingLeft: indent }}>
				{label ? `${label}: ` : ""}
				{String(data)}
			</div>
		);
	}

	if (typeof data === "string") {
		return (
			<div
				className={cn("font-mono text-xs text-muted-foreground", className)}
				style={{ paddingLeft: indent }}
				title={data.length > MAX_STRING_LENGTH ? data : undefined}
			>
				{label ? `${label}: ` : ""}"{truncate(data)}"
			</div>
		);
	}

	if (Array.isArray(data)) {
		const isEmpty = data.length === 0;
		return (
			<div className={cn("font-mono text-xs", className)} style={{ paddingLeft: indent }}>
				<button
					type="button"
					onClick={() => setExpanded((e) => !e)}
					className="flex items-center gap-0.5 text-left text-muted-foreground hover:text-foreground"
					aria-expanded={expanded}
				>
					<ChevronRight className={cn("size-3 shrink-0 transition-transform", expanded && "rotate-90")} />
					{label ? `${label}: ` : ""}[{data.length}]
				</button>
				{expanded && !isEmpty && (
					<div className="border-l border-border pl-1">
						{data.map((item, i) => (
							<JsonTree key={`${label ?? "root"}-${i}`} data={item} depth={depth + 1} label={String(i)} />
						))}
					</div>
				)}
			</div>
		);
	}

	if (isPlainObject(data)) {
		const keys = Object.keys(data);
		const isEmpty = keys.length === 0;
		return (
			<div className={cn("font-mono text-xs", className)} style={{ paddingLeft: indent }}>
				<button
					type="button"
					onClick={() => setExpanded((e) => !e)}
					className="flex items-center gap-0.5 text-left text-muted-foreground hover:text-foreground"
					aria-expanded={expanded}
				>
					<ChevronRight className={cn("size-3 shrink-0 transition-transform", expanded && "rotate-90")} />
					{label ? `${label}: ` : ""} {"{}"}
				</button>
				{expanded && !isEmpty && (
					<div className="border-l border-border pl-1">
						{keys.map((key) => (
							<JsonTree key={key} data={data[key]} depth={depth + 1} label={key} />
						))}
					</div>
				)}
			</div>
		);
	}

	return null;
}
