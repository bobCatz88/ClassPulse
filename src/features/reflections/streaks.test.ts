import { describe, expect, it } from "vitest";

import { reflectionDayStreak, weeklyReflectionCount } from "./streaks";

describe("streak refleksi", () => {
  it("mengira rekod minggu semasa", () => {
    expect(weeklyReflectionCount(["2026-07-19T02:00:00.000Z", "2026-07-13T02:00:00.000Z"], new Date("2026-07-19T12:00:00.000Z"))).toBe(1);
  });

  it("mengira ikut tarikh tempatan, bukan sempadan UTC", () => {
    expect(weeklyReflectionCount(["2026-07-18T17:30:00.000Z"], new Date("2026-07-18T18:00:00.000Z"), "Asia/Kuala_Lumpur")).toBe(1);
  });

  it("mengira hari berturutan dari hari ini", () => {
    expect(reflectionDayStreak(["2026-07-19T02:00:00.000Z", "2026-07-18T02:00:00.000Z"], new Date("2026-07-19T12:00:00.000Z"))).toBe(2);
  });

  it("mengekalkan streak apabila hari tempatan berbeza daripada UTC", () => {
    expect(reflectionDayStreak(["2026-07-18T17:30:00.000Z", "2026-07-17T17:30:00.000Z"], new Date("2026-07-18T18:00:00.000Z"), "Asia/Kuala_Lumpur")).toBe(2);
  });
});
