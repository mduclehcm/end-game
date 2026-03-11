import { isRewriteSupported } from "@algo/cv-core";
import { getRewriteSystemPrompt, parseFieldId } from "./rewrite-policy";

describe("rewrite-policy", () => {
	describe("getRewriteSystemPrompt", () => {
		it("returns prompt for summary.text", () => {
			const prompt = getRewriteSystemPrompt("summary", "text");
			expect(prompt).toBeTruthy();
			expect(prompt).toContain("professional summary");
		});

		it("returns prompt for experience.description", () => {
			const prompt = getRewriteSystemPrompt("experience", "description");
			expect(prompt).toBeTruthy();
			expect(prompt).toContain("job description");
		});

		it("returns prompt for education.description", () => {
			const prompt = getRewriteSystemPrompt("education", "description");
			expect(prompt).toBeTruthy();
			expect(prompt).toContain("education");
		});

		it("returns null for settings", () => {
			expect(getRewriteSystemPrompt("settings", "templateId")).toBeNull();
		});

		it("returns null for unknown section", () => {
			expect(getRewriteSystemPrompt("unknown", "text")).toBeNull();
		});

		it("returns null for unsupported field key", () => {
			expect(getRewriteSystemPrompt("summary", "other")).toBeNull();
		});
	});

	describe("isRewriteSupported", () => {
		it("returns true for summary.text", () => {
			expect(isRewriteSupported("summary", "text")).toBe(true);
		});

		it("returns true for experience.description", () => {
			expect(isRewriteSupported("experience", "description")).toBe(true);
		});

		it("returns false for settings.templateId", () => {
			expect(isRewriteSupported("settings", "templateId")).toBe(false);
		});

		it("returns false for unknown section", () => {
			expect(isRewriteSupported("unknown", "text")).toBe(false);
		});

		it("trims fieldKey", () => {
			expect(isRewriteSupported("summary", "  text  ")).toBe(true);
		});
	});

	describe("parseFieldId", () => {
		it("parses content.personal.firstName as null (static section has one entity)", () => {
			// personal is static but we use content.personal.fieldKey format; parseFieldId expects content.section.fieldName for static
			const r = parseFieldId("content.personal.firstName");
			expect(r).toEqual({
				section: "personal",
				entityIndex: null,
				fieldName: "firstName",
			});
		});

		it("parses content.summary.text", () => {
			const r = parseFieldId("content.summary.text");
			expect(r).toEqual({
				section: "summary",
				entityIndex: null,
				fieldName: "text",
			});
		});

		it("parses settings.pageSize", () => {
			const r = parseFieldId("settings.pageSize");
			expect(r).toEqual({
				section: "settings",
				entityIndex: null,
				fieldName: "pageSize",
			});
		});

		it("parses content.experience.0.description", () => {
			const r = parseFieldId("content.experience.0.description");
			expect(r).toEqual({
				section: "experience",
				entityIndex: 0,
				fieldName: "description",
			});
		});

		it("returns null for empty or invalid", () => {
			expect(parseFieldId("")).toBeNull();
			expect(parseFieldId("   ")).toBeNull();
			expect(parseFieldId("invalid")).toBeNull();
			expect(parseFieldId("content.unknown.x")).toBeNull();
		});
	});
});
