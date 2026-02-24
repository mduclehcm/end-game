import type { DocumentInfo } from "@algo/cv-core";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function mergeAndSortDocuments(listA: DocumentInfo[], listB: DocumentInfo[]): DocumentInfo[] {
	const merged = [...listA, ...listB];
	return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
