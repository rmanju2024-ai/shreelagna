import { describe, expect, it } from "vitest";
import { isMissingColumnError, missingPayloadColumn, saveErrorMessage } from "./db-errors";

describe("save errors", () => {
  it("treats a missing member number field as a missing column", () => {
    expect(
      isMissingColumnError(
        {
          code: "PGRST204",
          message: "Could not find the 'member_code' column of 'profiles' in the schema cache",
        },
        "member_code",
      ),
    ).toBe(true);
  });

  it("reads the column name from details when the message is generic", () => {
    expect(
      isMissingColumnError(
        { code: "PGRST204", message: "Bad Request", details: "member_code" },
        "member_code",
      ),
    ).toBe(true);
  });

  it("names the missing column so save can drop it and retry", () => {
    expect(
      missingPayloadColumn(
        {
          code: "PGRST204",
          message: "Could not find the 'native_city' column of 'profiles' in the schema cache",
        },
        { native_city: "Anekal", current_city: "Bengaluru" },
      ),
    ).toBe("native_city");
    expect(
      missingPayloadColumn(
        { code: "42703", message: 'column "current_state" does not exist' },
        { current_state: "Karnataka", native_state: "Karnataka" },
      ),
    ).toBe("current_state");
  });

  it("does not tell a signed-in member to sign in when a write is refused", () => {
    expect(
      saveErrorMessage({ message: "new row violates row-level security policy for table \"profiles\"" }),
    ).toBe("The profile could not be saved just now. Please try Save again.");
  });
});
