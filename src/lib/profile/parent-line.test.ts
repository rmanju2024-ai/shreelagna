import { describe, expect, it } from "vitest";
import { parentSentence, parseParentTags } from "./parent-line";

describe("parentSentence", () => {
  it("lets families pick passed away together with a profession", () => {
    expect(parentSentence("Ramakrishnappa", "Passed away · Farmer", "Father")).toBe(
      "Father **Ramakrishnappa** has passed away. He was a farmer",
    );
    expect(parentSentence("Ramakrishnappa", ["Passed away", "Business"], "Father")).toBe(
      "Father **Ramakrishnappa** has passed away. He was in business",
    );
    expect(parentSentence("Ramakrishnappa", "Farmer - Expired", "Father")).toBe(
      "Father **Ramakrishnappa** has passed away. He was a farmer",
    );
  });

  it("frames retired and homemaker without a working-as clause", () => {
    expect(parentSentence("Ravi", "Retired · Business", "Father")).toBe(
      "Father is **Ravi**, a retired businessman",
    );
    expect(parentSentence("Kempamma", "Homemaker", "Mother")).toBe("Mother is **Kempamma**, a homemaker");
    expect(parentSentence("Ravi", "Employed", "Father")).toBe("Father is **Ravi**, employed");
  });

  it("covers unknown father details", () => {
    expect(parentSentence("Ravi", "Don't know", "Father")).toBe("Father is **Ravi**");
    expect(parentSentence("", "Don't know", "Father")).toBe("Father's details are not known");
  });
});

describe("parseParentTags", () => {
  it("splits combined choices and old free text", () => {
    expect(parseParentTags("Passed away · Business")).toEqual(["Passed away", "Business"]);
    expect(parseParentTags("Retired businessman")).toEqual(["Retired", "Business"]);
  });
});
