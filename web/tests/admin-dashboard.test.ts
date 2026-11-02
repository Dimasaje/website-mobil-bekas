import { describe, expect, it } from "bun:test";
import { formatRelative } from "../src/pages/admin/AdminDashboardPage";

describe("Admin dashboard ringkas (T-32)", () => {
  it("formats lead timestamps compactly for Indonesian readers", () => {
    const formatted = formatRelative("2026-11-02T04:20:00.000Z");

    expect(formatted).toContain("02");
    expect(formatted).not.toContain("T04:20:00");
  });

  it("keeps unparsable timestamps untouched", () => {
    expect(formatRelative("kemarin")).toBe("kemarin");
  });
});
