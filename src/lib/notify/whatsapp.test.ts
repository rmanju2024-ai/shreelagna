import { describe, expect, it } from "vitest";
import {
  buildWhatsAppPayload,
  isHelloWorldTemplate,
  resolveAlertTemplate,
  whatsappFailFlag,
} from "./whatsapp";

describe("WhatsApp payload", () => {
  it("builds an auth template with copy-code button", () => {
    const payload = buildWhatsAppPayload({
      to: "919876543210",
      name: "shreelagna_otp",
      language: "en_US",
      bodyParams: ["123456"],
      copyCode: "123456",
    });
    expect(payload).toEqual({
      messaging_product: "whatsapp",
      to: "919876543210",
      type: "template",
      template: {
        name: "shreelagna_otp",
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
      name: "shreelagna_interest",
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
    expect(whatsappFailFlag("WhatsApp could not be reached.")).toBe("net");
  });

  it("uses hello_world for alerts outside production unless overridden", () => {
    const previous = process.env.WHATSAPP_ALERT_TEMPLATE;
    delete process.env.WHATSAPP_ALERT_TEMPLATE;
    expect(resolveAlertTemplate("shreelagna_interest")).toBe("hello_world");
    process.env.WHATSAPP_ALERT_TEMPLATE = "shreelagna_interest";
    expect(resolveAlertTemplate("shreelagna_interest")).toBe("shreelagna_interest");
    if (previous) process.env.WHATSAPP_ALERT_TEMPLATE = previous;
    else delete process.env.WHATSAPP_ALERT_TEMPLATE;
  });
});
