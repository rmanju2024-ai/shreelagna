import { describe, expect, it } from "vitest";
import {
  creatorRolesForForm,
  parentLine,
  postedAsLabel,
  siblingLine,
  toDbCreatorRelationship,
} from "./options";

describe("toDbCreatorRelationship", () => {
  it("maps sister and brother to sibling for the original enum", () => {
    expect(toDbCreatorRelationship("sister")).toBe("sibling");
    expect(toDbCreatorRelationship("brother")).toBe("sibling");
  });

  it("maps guardian to relative until the extra enum is applied", () => {
    expect(toDbCreatorRelationship("guardian")).toBe("relative");
    expect(toDbCreatorRelationship("self")).toBe("self");
  });
});

describe("postedAsLabel", () => {
  it("names who created the portrait", () => {
    expect(postedAsLabel("self", "vara")).toBe("Created by Self");
    expect(postedAsLabel("parent")).toBe("Created by Family");
  });
});

describe("parentLine", () => {
  it("joins name and profession once", () => {
    expect(parentLine("Ramesh", "Retired HAL")).toBe("Ramesh, Retired HAL");
    expect(parentLine("Ramesh", "Ramesh, Retired HAL")).toBe("Ramesh, Retired HAL");
    expect(parentLine("", "House Wife", "—")).toBe("House Wife");
  });
});

describe("siblingLine", () => {
  it("combines count with married and unmarried", () => {
    expect(siblingLine(2, 0)).toBe("2 (Unmarried)");
    expect(siblingLine(2, 2)).toBe("2 (Married)");
    expect(siblingLine(2, 1)).toBe("2 (1 Married & 1 Unmarried)");
    expect(siblingLine(0, 0)).toBe("0");
    expect(siblingLine(3, null)).toBe("3");
    expect(siblingLine(null, 1)).toBe("—");
  });
});

describe("creatorRolesForForm", () => {
  it("offers family roles only for a new profile", () => {
    const values = creatorRolesForForm().map((r) => r.value);
    expect(values).toEqual(["self", "parent", "sister", "brother", "guardian"]);
    expect(values).not.toContain("friend");
    expect(values).not.toContain("relative");
    expect(values).not.toContain("colleague");
  });
});
