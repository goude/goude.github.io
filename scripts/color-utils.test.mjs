import { describe, it, expect } from "vitest";
import {
  isHexColor,
  hexToRgb,
  rgbToHex,
  evalColorMix,
} from "./color-utils.mjs";

describe("isHexColor", () => {
  it("accepts 6-digit hex", () => {
    expect(isHexColor("#aabbcc")).toBe(true);
  });
  it("accepts 3-digit hex", () => {
    expect(isHexColor("#abc")).toBe(true);
  });
  it("is case-insensitive", () => {
    expect(isHexColor("#AABBCC")).toBe(true);
  });
  it("rejects bare color name", () => {
    expect(isHexColor("red")).toBe(false);
  });
  it("rejects rgb() syntax", () => {
    expect(isHexColor("rgb(0,0,0)")).toBe(false);
  });
});

describe("hexToRgb", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
  });
  it("parses 3-digit hex by doubling digits", () => {
    expect(hexToRgb("#f80")).toEqual({ r: 255, g: 136, b: 0 });
  });
  it("returns null for invalid input", () => {
    expect(hexToRgb("notacolor")).toBeNull();
  });
});

describe("rgbToHex", () => {
  it("converts rgb to lowercase hex", () => {
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#ff8000");
  });
  it("clamps values above 255", () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe("#ff0000");
  });
  it("rounds fractional values", () => {
    expect(rgbToHex({ r: 127.6, g: 0, b: 0 })).toBe("#800000");
  });
});

describe("evalColorMix", () => {
  const id = (x) => x;

  it("mixes two hex colors at 50%", () => {
    const result = evalColorMix("color-mix(in srgb, #ff0000 50%, #0000ff)", id);
    expect(result).toBe("#800080");
  });

  it("returns null for unrecognised syntax", () => {
    expect(evalColorMix("color-mix(in oklch, red 50%, blue)", id)).toBeNull();
  });

  it("returns null when resolver returns null", () => {
    const result = evalColorMix(
      "color-mix(in srgb, var(--missing) 50%, #ffffff)",
      () => null
    );
    expect(result).toBeNull();
  });

  it("passes color tokens to resolveColor", () => {
    const palette = { "var(--fg)": "#000000", "var(--bg)": "#ffffff" };
    const resolve = (x) => palette[x] ?? null;
    const result = evalColorMix(
      "color-mix(in srgb, var(--fg) 0%, var(--bg))",
      resolve
    );
    expect(result).toBe("#ffffff");
  });
});
