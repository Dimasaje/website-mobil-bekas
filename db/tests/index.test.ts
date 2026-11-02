import { describe, expect, it } from "bun:test";
import { DB_PACKAGE_READY } from "../src/index";

describe("DB package", () => {
  it("is initialized", () => {
    expect(DB_PACKAGE_READY).toBe(true);
  });
});
