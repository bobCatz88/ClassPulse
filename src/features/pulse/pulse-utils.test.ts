import { describe, expect, it } from "vitest";

import { pulseColor, pulseLabel } from "./pulse-utils";

describe("paparan Pulse", () => {
  it("memetakan setiap tahap kefahaman kepada warna dan label yang jelas", () => {
    expect(pulseColor("strong")).toBe("#2a9d73");
    expect(pulseLabel("needs_support")).toBe("Perlu bantuan");
  });
});
