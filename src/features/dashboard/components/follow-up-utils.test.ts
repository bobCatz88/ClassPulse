import { describe, expect, it } from "vitest";

import { dueMatches } from "./follow-up-utils";

describe("penapis tarikh susulan", () => {
  const now = new Date("2026-07-19T12:00:00+08:00");

  it("mengasingkan item tertunggak, minggu ini dan tanpa tarikh", () => {
    expect(dueMatches("2026-07-18", "overdue", now)).toBe(true);
    expect(dueMatches("2026-07-23", "this_week", now)).toBe(true);
    expect(dueMatches("2026-07-27", "this_week", now)).toBe(false);
    expect(dueMatches(null, "no_date", now)).toBe(true);
  });
});
