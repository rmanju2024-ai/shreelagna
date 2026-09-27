import { describe, expect, it } from "vitest";
import { sessionFromCookieValue, tokenFromRawCookie } from "./session-cookie";

describe("session cookie token", () => {
  it("reads access_token from a standard base64 cookie payload", () => {
    const json = JSON.stringify({ access_token: "house-token", refresh_token: "r" });
    const raw = `base64-${Buffer.from(json, "utf8").toString("base64")}`;
    expect(tokenFromRawCookie(raw)).toBe("house-token");
  });

  it("reads tokens from a base64url cookie with hyphen characters", () => {
    const json = JSON.stringify({ access_token: "jwt-part", refresh_token: "ref-part" });
    const raw = `base64-${Buffer.from(json, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")}`;
    expect(sessionFromCookieValue(raw)).toEqual({
      access_token: "jwt-part",
      refresh_token: "ref-part",
    });
  });
});
