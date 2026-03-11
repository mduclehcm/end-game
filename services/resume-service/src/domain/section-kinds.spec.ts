import { isArraySection, SECTION_KINDS_LIST, STATIC_SECTIONS } from "./section-kinds";

describe("section-kinds", () => {
	describe("isArraySection", () => {
		it("returns true for experience, education, skills, languages", () => {
			expect(isArraySection("experience")).toBe(true);
			expect(isArraySection("education")).toBe(true);
			expect(isArraySection("skills")).toBe(true);
			expect(isArraySection("languages")).toBe(true);
		});

		it("returns false for personal, summary, settings", () => {
			expect(isArraySection("personal")).toBe(false);
			expect(isArraySection("summary")).toBe(false);
			expect(isArraySection("settings")).toBe(false);
		});
	});

	describe("SECTION_KINDS_LIST", () => {
		it("includes all expected kinds", () => {
			expect(SECTION_KINDS_LIST).toContain("personal");
			expect(SECTION_KINDS_LIST).toContain("summary");
			expect(SECTION_KINDS_LIST).toContain("experience");
			expect(SECTION_KINDS_LIST).toContain("education");
			expect(SECTION_KINDS_LIST).toContain("skills");
			expect(SECTION_KINDS_LIST).toContain("languages");
			expect(SECTION_KINDS_LIST).toContain("settings");
			expect(SECTION_KINDS_LIST).toHaveLength(7);
		});
	});

	describe("STATIC_SECTIONS", () => {
		it("contains personal and summary", () => {
			expect(STATIC_SECTIONS).toEqual(["personal", "summary"]);
		});
	});
});
