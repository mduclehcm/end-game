import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/store";
import { Section } from "../section";

type BuilderFieldInputProps = {
  className?: string;
  name: string;
  label: string;
  placeholder?: string;
  field: string;
};

export function BuilderFieldInput({
  className,
  name,
  label,
  placeholder,
  field,
}: BuilderFieldInputProps) {
  const value = useBuilderStore((state) => state.fields[field]);
  const setValue = useBuilderStore((state) => state.setFieldValue);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(field, e.target.value);
  };
  return (
    <Field className={className}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
    </Field>
  );
}

export function PersonalDetailsSection() {
  return (
    <Section
      name="personal-details"
      title="Personal Details"
      description="Users who added phone number and email received 64% more positive feedback from recruiters."
      hasAdvanceFields={true}
    >
      {() => (
        <>
          <BuilderFieldInput
            className="col-span-2 mt-2"
            name="job-target"
            label="Job Target"
            field="content.personal.title"
          />
          <BuilderFieldInput
            name="first-name"
            label="First Name"
            field="content.personal.firstName"
          />
          <BuilderFieldInput
            name="last-name"
            label="Last Name"
            field="content.personal.lastName"
          />
          <BuilderFieldInput
            name="phone"
            label="Phone"
            field="content.personal.phone"
          />
          <BuilderFieldInput
            name="email"
            label="Email"
            field="content.personal.email"
          />
          <BuilderFieldInput
            name="linkedin"
            label="LinkedIn"
            field="content.personal.linkedin"
          />
          <BuilderFieldInput
            name="postal-code"
            label="Postal Code"
            field="content.personal.postalCode"
          />
          <BuilderFieldInput
            name="location"
            label="Location"
            field="content.personal.location"
          />
          <BuilderFieldInput
            name="country"
            label="Country"
            field="content.personal.country"
          />
        </>
      )}
    </Section>
  );
}
