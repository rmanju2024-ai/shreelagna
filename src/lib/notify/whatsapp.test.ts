import { describe, expect, it, vi } from "vitest";
import {
  buildRegisterPayload,
  buildWhatsAppPayload,
  isHelloWorldTemplate,
  resolveAlertTemplate,
  explainWhatsAppError,
  otpLanguageCandidates,
  whatsappPhoneNumberIds,
  whatsappFailFlag,
  whatsappSendAlerts,
} from "./whatsapp";

describe("WhatsApp payload", () => {
  it("builds an auth template with copy-code button", () => {
    const payload = buildWhatsAppPayload({
      to: "919876543210",
      name: "marriageconnect_otp",
      language: "en_US",
      bodyParams: ["123456"],
      copyCode: "123456",
    });
    expect(payload).toEqual({
      messaging_product: "whatsapp",
      to: "919876543210",
      type: "template",
      template: {
        name: "marriageconnect_otp",
        language: { code: "en_US" },
        components: [
          { type: "body", parameters: [{ type: "text", text: "123456" }] },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: "123456" }],
          },
        ],
      },
    });
  });

  it("builds a utility template with one name", () => {
    const payload = buildWhatsAppPayload({
      to: "919876543210",
      name: "marriageconnect_interest",
      language: "en",
      bodyParams: ["Rohan"],
    });
    expect((payload.template as { components: unknown[] }).components).toHaveLength(1);
  });

  it("sends hello_world with no variables", () => {
    const payload = buildWhatsAppPayload({
      to: "919876543210",
      name: "hello_world",
      language: "en_US",
    });
    expect(payload.template).toEqual({
      name: "hello_world",
      language: { code: "en_US" },
    });
    expect(isHelloWorldTemplate("hello_world")).toBe(true);
  });

  it("maps Meta allow-list failures for the browse note", () => {
    expect(whatsappFailFlag("(#131030) Recipient phone number not in allowed list")).toBe("allowlist");
    expect(whatsappFailFlag("(#131005) Access denied — token or permissions")).toBe("denied");
    expect(whatsappFailFlag("(#133010) Account not registered")).toBe("mobile");
    expect(whatsappFailFlag("WhatsApp could not be reached.")).toBe("net");
    expect(explainWhatsAppError(132001, "template name (marriageconnect_otp) does not exist in en_US")).toMatch(
      /marriageconnect_otp/,
    );
    expect(explainWhatsAppError(133010, "(#133010) Account not registered")).toMatch(/REGISTER_PIN/);
    expect(buildRegisterPayload("847291")).toEqual({ messaging_product: "whatsapp", pin: "847291" });
    expect(otpLanguageCandidates("en")).toEqual(["en", "en_US"]);
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "111, 222");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID_FALLBACK", "111");
    expect(whatsappPhoneNumberIds()).toEqual(["111", "222"]);
  });

  it("does not send house alerts unless WHATSAPP_SEND_ALERTS is on", () => {
    const previous = process.env.WHATSAPP_SEND_ALERTS;
    delete process.env.WHATSAPP_SEND_ALERTS;
    expect(whatsappSendAlerts()).toBe(false);
    process.env.WHATSAPP_SEND_ALERTS = "yes";
    expect(whatsappSendAlerts()).toBe(true);
    if (previous) process.env.WHATSAPP_SEND_ALERTS = previous;
    else delete process.env.WHATSAPP_SEND_ALERTS;
  });

  it("uses hello_world for alerts outside production unless overridden", () => {
    const previous = process.env.WHATSAPP_ALERT_TEMPLATE;
    delete process.env.WHATSAPP_ALERT_TEMPLATE;
    expect(resolveAlertTemplate("marriageconnect_interest")).toBe("hello_world");
    process.env.WHATSAPP_ALERT_TEMPLATE = "marriageconnect_interest";
    expect(resolveAlertTemplate("marriageconnect_interest")).toBe("marriageconnect_interest");
    if (previous) process.env.WHATSAPP_ALERT_TEMPLATE = previous;
    else delete process.env.WHATSAPP_ALERT_TEMPLATE;
  });
});
