import { describe, it, expect } from "vitest";
import { getISOWeek, pad, formatDate, formatTime } from "./date.js";

describe("pad", () => {
  it("pads single digits to 2 chars by default", () => {
    expect(pad(5)).toBe("05");
  });
  it("leaves two-digit numbers unchanged", () => {
    expect(pad(12)).toBe("12");
  });
  it("respects custom width", () => {
    expect(pad(7, 3)).toBe("007");
  });
});

describe("formatDate", () => {
  it("formats a UTC date as YYYY-MM-DD", () => {
    expect(formatDate(new Date("2024-03-07T00:00:00Z"))).toBe("2024-03-07");
  });
  it("pads month and day", () => {
    expect(formatDate(new Date("2024-01-02T00:00:00Z"))).toBe("2024-01-02");
  });
});

describe("formatTime", () => {
  it("formats UTC hours and minutes as HH:MM", () => {
    expect(formatTime(new Date("2024-01-01T09:05:00Z"))).toBe("09:05");
  });
  it("formats midnight", () => {
    expect(formatTime(new Date("2024-01-01T00:00:00Z"))).toBe("00:00");
  });
});

describe("getISOWeek", () => {
  it("returns week 1 for 2024-01-01 (Monday)", () => {
    expect(getISOWeek(new Date(2024, 0, 1))).toBe(1);
  });
  it("returns week 52 for 2023-12-31", () => {
    expect(getISOWeek(new Date(2023, 11, 31))).toBe(52);
  });
  it("returns week 53 for 2020-12-31 (53-week year)", () => {
    expect(getISOWeek(new Date(2020, 11, 31))).toBe(53);
  });
  it("returns week 10 for 2024-03-07", () => {
    expect(getISOWeek(new Date(2024, 2, 7))).toBe(10);
  });
});
