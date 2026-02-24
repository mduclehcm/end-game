import { BuilderFieldInput } from "../input";
import { Section } from "../section";

export function PersonalDetailsFormSection() {
	return (
		<Section
			name="personal-details"
			title="Personal Details"
			description="Users who added phone number and email received 64% more positive feedback from recruiters."
			hasAdvanceFields
			draggable={false}
		>
			{() => (
				<>
					<BuilderFieldInput className="col-span-2 mt-2" name="job-target" label="Job Target" field="personal.title" />
					<BuilderFieldInput name="first-name" label="First Name" field="personal.firstName" />
					<BuilderFieldInput name="last-name" label="Last Name" field="personal.lastName" />
					<BuilderFieldInput name="phone" label="Phone" field="personal.phone" />
					<BuilderFieldInput name="email" label="Email" field="personal.email" />
					<BuilderFieldInput name="linkedin" label="LinkedIn" field="personal.linkedin" />
					<BuilderFieldInput name="postal-code" label="Postal Code" field="personal.postalCode" />
					<BuilderFieldInput name="location" label="Location" field="personal.location" />
					<BuilderFieldInput name="country" label="Country" field="personal.country" />
				</>
			)}
		</Section>
	);
}
