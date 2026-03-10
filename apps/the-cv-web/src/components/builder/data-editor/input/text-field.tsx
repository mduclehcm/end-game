import { useEffect, useRef } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/store";

type BuilderFieldInputProps = {
	className?: string;
	name: string;
	label: string;
	placeholder?: string;
	field: string;
	/** Document path for this field (e.g. content.personal.email). When set, focus will set active field in preview. */
	dataKey?: string;
};

export function BuilderFieldInput({ className, name, label, placeholder, field, dataKey }: BuilderFieldInputProps) {
	const value = useBuilderStore((state) => state.data.fieldValues[field] ?? "");
	const setValue = useBuilderStore((state) => state.setFieldValue);
	const setActiveField = useBuilderStore((state) => state.setActiveField);
	const activeField = useBuilderStore((state) => state.activeField);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(field, e.target.value);
	};
	const handleFocus = () => {
		if (dataKey != null) setActiveField(dataKey);
	};

	// When preview sets activeField to this field, scroll into view and focus (e.g. click on preview element)
	useEffect(() => {
		if (dataKey == null || activeField !== dataKey) return;
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		if (wrapper.contains(document.activeElement)) return; // Already focused from data editor
		wrapper.scrollIntoView({ block: "nearest", behavior: "smooth" });
		const input = wrapper.querySelector<HTMLInputElement>("input");
		requestAnimationFrame(() => input?.focus());
	}, [dataKey, activeField]);

	return (
		<Field ref={wrapperRef} className={className} data-data-key={dataKey ?? undefined}>
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Input id={name} placeholder={placeholder} value={value} onChange={handleChange} onFocus={handleFocus} />
		</Field>
	);
}
