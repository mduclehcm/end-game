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
			{(showMore) => (
				<>
					<BuilderFieldInput
						className="col-span-2 mt-2"
						name="job-target"
						label="Job Target"
						field="content.personal.title"
					/>
					<BuilderFieldInput name="first-name" label="First Name" field="content.personal.firstName" />
					<BuilderFieldInput name="last-name" label="Last Name" field="content.personal.lastName" />
					<BuilderFieldInput name="phone" label="Phone" field="content.personal.phone" />
					<BuilderFieldInput name="email" label="Email" field="content.personal.email" />
					<BuilderFieldInput name="linkedin" label="LinkedIn" field="content.personal.linkedin" />
					<BuilderFieldInput name="postal-code" label="Postal Code" field="content.personal.postalCode" />
					<BuilderFieldInput name="location" label="Location" field="content.personal.location" />
					<BuilderFieldInput name="country" label="Country" field="content.personal.country" />
					{showMore && (
						<>
							<BuilderFieldInput
								className="col-span-2"
								name="address"
								label="Address"
								field="content.personal.address"
							/>
							<BuilderFieldInput name="nationality" label="Nationality" field="content.personal.nationality" />
							<BuilderFieldInput name="place-of-birth" label="Place Of Birth" field="content.personal.placeOfBirth" />
							<BuilderFieldInput
								name="driving-license"
								label="Driving License"
								field="content.personal.drivingLicense"
							/>
							<BuilderFieldInput
								name="date-of-birth"
								label="Date Of Birth"
								field="content.personal.dateOfBirth"
								placeholder="YYYY-MM-DD"
							/>
						</>
					)}
				</>
			)}
		</Section>
	);
}
