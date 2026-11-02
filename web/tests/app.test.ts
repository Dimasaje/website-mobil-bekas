import { describe, expect, it } from "bun:test";
import { App } from "../src/App";

describe("Web App component", () => {
  it("is exported as a function", () => {
    expect(typeof App).toBe("function");
  });
});
