import { describe, expect, it } from "vitest";
import { houseRoleMark, isStaffRole } from "./access";

describe("house role mark", () => {
  it("seals admin, staff and member", () => {
    expect(houseRoleMark("admin")).toBe("admin");
    expect(houseRoleMark("service")).toBe("staff");
    expect(houseRoleMark("member")).toBe("member");
    expect(houseRoleMark(null)).toBeNull();
    expect(isStaffRole("service")).toBe(true);
    expect(isStaffRole("member")).toBe(false);
  });
});
