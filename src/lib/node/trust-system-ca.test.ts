import { describe, expect, it } from "vitest";
import { trustSystemCa } from "./trust-system-ca";

describe("trustSystemCa", () => {
  it("loads OS certificates without throwing", () => {
    expect(trustSystemCa()).toBe(true);
  });
});
