import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  AccomplishmentsSection,
  AreasOfExpertiseSection,
  EducationSection,
  EmploymentHistorySection,
  PersonalDetailsSection,
  PowerStatementSection,
  ProfessionalSummarySection,
  TechnicalProficienciesSection,
} from "./sections";
import { AnimatedSection } from "./animated-section";

export function DataEditor() {
  return (
    <FieldGroup className="p-4 pt-5 bg-muted">
      <AnimatedSection index={0}>
        <PersonalDetailsSection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={1}>
        <EmploymentHistorySection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={2}>
        <EducationSection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={3}>
        <AreasOfExpertiseSection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={4}>
        <ProfessionalSummarySection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={5}>
        <AccomplishmentsSection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={6}>
        <TechnicalProficienciesSection />
        <Separator />
      </AnimatedSection>
      <AnimatedSection index={7}>
        <PowerStatementSection />
      </AnimatedSection>
    </FieldGroup>
  );
}
