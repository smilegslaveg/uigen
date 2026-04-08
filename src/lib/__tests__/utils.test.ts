import { test, expect, describe } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  test("returns a single class name unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  test("joins multiple class names", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  test("ignores falsy values", () => {
    expect(cn("foo", undefined, null, false, "", "bar")).toBe("foo bar");
  });

  test("handles conditional classes via objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  test("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  test("returns empty string when all inputs are falsy", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  test("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });

  test("merges conflicting Tailwind classes (last wins)", () => {
    // twMerge behaviour: the last conflicting utility wins
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  test("preserves non-conflicting Tailwind classes", () => {
    const result = cn("px-4", "py-2", "text-sm");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
    expect(result).toContain("text-sm");
  });

  test("handles mixed conditional and string inputs", () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn("base", { active: isActive, disabled: isDisabled });
    expect(result).toBe("base active");
  });

  test("handles deeply nested arrays", () => {
    const result = cn(["foo", ["bar", "baz"]]);
    expect(result).toBe("foo bar baz");
  });
});
