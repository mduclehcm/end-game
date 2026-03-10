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
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(field, e.target.value);
	};
	const handleFocus = () => {
		if (dataKey != null) setActiveField(dataKey);
	};
	return (
		<Field className={className}>
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Input
				id={name}
				placeholder={placeholder}
				value={value}
				onChange={handleChange}
				onFocus={handleFocus}
			/>
		</Field>
	);
}
