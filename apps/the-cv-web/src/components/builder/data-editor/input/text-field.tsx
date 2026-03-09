import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/store";

type BuilderFieldInputProps = {
	className?: string;
	name: string;
	label: string;
	placeholder?: string;
	field: string;
};

export function BuilderFieldInput({ className, name, label, placeholder, field }: BuilderFieldInputProps) {
	const value = useBuilderStore((state) => state.data.fieldValues[field] ?? "");
	const setValue = useBuilderStore((state) => state.setFieldValue);
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(field, e.target.value);
	};
	return (
		<Field className={className}>
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Input id={name} placeholder={placeholder} value={value} onChange={handleChange} />
		</Field>
	);
}
