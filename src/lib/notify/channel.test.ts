import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyProvider, sendChannelAlert } from "./channel";

describe("notify channel", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses WhatsApp when Cloud API keys are set", () => {
    vi.stubEnv("NOTIFY_CHANNEL", "");
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    vi.stubEnv("ARATTAI_CLIENT_ID", "cid");
    vi.stubEnv("ARATTAI_CLIENT_SECRET", "sec");
    vi.stubEnv("ARATTAI_COMPANY_ID", "co");
    vi.stubEnv("ARATTAI_BUSINESS_NUMBER_ID", "bn");
    expect(notifyProvider()).toBe("whatsapp");
  });

  it("falls back to Arattai when WhatsApp keys are missing", () => {
    vi.stubEnv("NOTIFY_CHANNEL", "");
    vi.stubEnv("WHATSAPP_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("ARATTAI_CLIENT_ID", "cid");
    vi.stubEnv("ARATTAI_CLIENT_SECRET", "sec");
    vi.stubEnv("ARATTAI_COMPANY_ID", "co");
    vi.stubEnv("ARATTAI_BUSINESS_NUMBER_ID", "bn");
    expect(notifyProvider()).toBe("arattai");
  });

  it("skips WhatsApp interest and plan alerts unless they are turned on", async () => {
    vi.stubEnv("WHATSAPP_SEND_ALERTS", "false");
    vi.stubEnv("WHATSAPP_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    await expect(sendChannelAlert("interest", "919876543210", ["Interest", "Hi"])).resolves.toEqual({ ok: true });
  });
});
