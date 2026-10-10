import { describe, expect, it } from "vitest";
import {
  buildArattaiTemplatePayload,
  buildArattaiTextPayload,
  interestMessage,
  otpMessage,
} from "./arattai";

describe("Arattai payloads", () => {
  it("builds a plain OTP text message", () => {
    expect(buildArattaiTextPayload({ to: "919876543210", text: otpMessage("123456") })).toEqual({
      messaging_product: "arattai",
      recipient_type: "individual",
      to: "919876543210",
      type: "text",
      text: { body: otpMessage("123456") },
    });
    expect(otpMessage("123456")).toContain("123456");
  });

  it("builds a template when Arattai requires one", () => {
    expect(
      buildArattaiTemplatePayload({
        to: "919876543210",
        name: "shreelagna_otp",
        language: "en",
        bodyParams: ["123456"],
      }),
    ).toEqual({
      messaging_product: "arattai",
      recipient_type: "individual",
      to: "919876543210",
      type: "template",
      template: {
        name: "shreelagna_otp",
        language: { code: "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: "123456" }] }],
      },
    });
  });

  it("keeps interest copy short", () => {
    expect(interestMessage("Priya")).toContain("Priya");
  });
});
