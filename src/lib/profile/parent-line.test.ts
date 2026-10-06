import { describe, expect, it } from "vitest";
import { parentSentence } from "./parent-line";

describe("parentSentence", () => {
  it("does not say working as when a parent has passed away", () => {
    expect(parentSentence("Ramakrishnappa", "Passed away", "Father")).toBe(
      "Father **Ramakrishnappa** has passed away",
    );
    expect(parentSentence("Ramakrishnappa", "Farmer - Expired", "Father")).toBe(
      "Father **Ramakrishnappa** has passed away",
    );
    expect(parentSentence("Kempamma", "Passed away · was a farmer", "Mother")).toBe(
      "Mother **Kempamma** has passed away. She was a farmer",
    );
  });

  it("frames retired and homemaker without a working-as clause", () => {
    expect(parentSentence("Ravi", "Retired businessman", "Father")).toBe(
      "Father is **Ravi**, a retired businessman",
    );
    expect(parentSentence("Kempamma", "Homemaker", "Mother")).toBe("Mother is **Kempamma**, a homemaker");
    expect(parentSentence("Ravi", "Employed", "Father")).toBe("Father is **Ravi**, employed");
    expect(parentSentence("Ravi", "Business", "Father")).toBe("Father is **Ravi**, in business");
  });

  it("skips unknown work and still names the parent", () => {
    expect(parentSentence("Ravi", "Don't know", "Father")).toBe("Father is **Ravi**");
  });
});
