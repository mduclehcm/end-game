import { fieldPath } from "./field-path";

describe("field-path", () => {
	describe("fieldPath", () => {
		it("returns settings.* for settings kind", () => {
			expect(fieldPath("settings", 0, "pageSize", false)).toBe("settings.pageSize");
		});

		it("returns content.kind.key for static section single entity", () => {
			expect(fieldPath("personal", 0, "firstName", false)).toBe("content.personal.firstName");
			expect(fieldPath("summary", 0, "text", false)).toBe("content.summary.text");
		});

		it("returns content.kind.index.key for array section multi entity", () => {
			expect(fieldPath("experience", 0, "position", true)).toBe("content.experience.0.position");
			expect(fieldPath("experience", 1, "description", true)).toBe("content.experience.1.description");
		});
	});
});
