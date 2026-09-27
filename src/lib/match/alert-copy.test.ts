import { describe, expect, it } from "vitest";
import {
  alertActionLabel,
  alertHeadline,
  alertLine,
  alertWhen,
  chatReceivedCopy,
  interestAcceptedCopy,
  interestDeclinedCopy,
  interestReceivedCopy,
  contactViewedCopy,
  profileViewedCopy,
} from "./alert-copy";

describe("alert copy", () => {
  it("uses one line for a new interest", () => {
    expect(interestReceivedCopy("Ananya", "Rohan").body).toBe("Rohan sent you an interest.");
  });

  it("uses one line when interest is accepted", () => {
    expect(interestAcceptedCopy("Rohan", "Ananya").body).toBe("Ananya accepted your interest — start a chat.");
  });

  it("uses one line when interest is declined", () => {
    expect(interestDeclinedCopy("Rohan", "Ananya").body).toBe("Ananya declined your interest.");
    expect(interestDeclinedCopy("Rohan", "Ananya", "Looking nearby").body).toBe(
      "Ananya declined your interest — Looking nearby",
    );
    expect(alertHeadline("interest_declined", "Ananya", "Ananya declined your interest.")).toEqual({
      name: "Ananya",
      detail: "declined your interest",
    });
  });

  it("uses one line for a chat message", () => {
    expect(chatReceivedCopy("Ananya", "Rohan", "Shall we talk?").body).toBe("Rohan sent a message: Shall we talk?");
  });

  it("prints date and time together", () => {
    expect(alertWhen("2026-09-24T18:19:00+05:30")).toBe("24 Sep 2026 · 6:19 pm IST");
  });

  it("rewrites stored alerts into one readable line", () => {
    expect(alertLine("chat", "New message", "Manjunatha: super")).toBe("Manjunatha sent a message: super");
    expect(alertLine("chat", "Manjunatha", "Manjunatha: hi")).toBe("Manjunatha sent a message: hi");
    expect(alertLine("match", "New match", "A complete profile fits your partner preference.")).toBe(
      "A new match fits your preference.",
    );
    expect(alertActionLabel("chat", "/app/chat/1")).toBe("Open chat");
    expect(alertActionLabel("interest_received", "/app/interests")).toBe("Open inbox");
    expect(profileViewedCopy("Rohan").body).toBe("Rohan viewed your profile.");
    expect(contactViewedCopy("Rohan").body).toBe("Rohan viewed your mobile and email.");
    expect(alertHeadline("profile_view", "Rohan", "Rohan viewed your profile.")).toEqual({
      name: "Rohan",
      detail: "viewed your profile",
    });
    expect(alertHeadline("contact_view", "Rohan", "Rohan viewed your mobile and email.")).toEqual({
      name: "Rohan",
      detail: "viewed your mobile and email",
    });
    expect(alertLine("profile_view", "Rohan", "Rohan viewed your profile.")).toBe("Rohan viewed your profile.");
    expect(alertLine("contact_view", "Rohan", "Rohan viewed your mobile and email.")).toBe(
      "Rohan viewed your mobile and email.",
    );
  });
});
