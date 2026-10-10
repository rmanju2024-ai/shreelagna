import { afterEach, describe, expect, it, vi } from "vitest";
import { arattaiConfigured, arattaiOperatorHint, buildArattaiAuthBody, buildArattaiTemplatePayload } from "./arattai";

describe("Arattai payloads", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("explains missing operator config without mentioning WhatsApp as the live path", () => {
    vi.stubEnv("ARATTAI_CLIENT_ID", "");
    expect(arattaiConfigured()).toBe(false);
    expect(arattaiOperatorHint()).toMatch(/ARATTAI_CLIENT_ID/);
    expect(arattaiOperatorHint()).toMatch(/WhatsApp is not used/);
  });

  it("prefers refresh-token OAuth when a refresh token is present", () => {
    vi.stubEnv("ARATTAI_CLIENT_ID", "cid");
    vi.stubEnv("ARATTAI_CLIENT_SECRET", "sec");
    vi.stubEnv("ARATTAI_REFRESH_TOKEN", "rt");
    const body = buildArattaiAuthBody();
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("rt");
  });

  it("builds an OTP authentication template for an Indian mobile", () => {
    vi.stubEnv("ARATTAI_COMPANY_ID", "co_1");
    vi.stubEnv("ARATTAI_BUSINESS_NUMBER_ID", "bn_1");
    const payload = buildArattaiTemplatePayload({
      to: "919876543210",
      templateId: "tmpl_otp",
      bodyParams: ["123456"],
      otp: "123456",
      authentication: true,
    });
    expect(payload).toMatchObject({
      company_id: "co_1",
      business_number_id: "bn_1",
      to: "919876543210",
      type: "authentication",
      template: { id: "tmpl_otp" },
    });
  });
});
