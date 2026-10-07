import { describe, expect, it, vi } from "vitest";
import { dismissTo, profileLeaveTarget, profileOpenHref, withProfileFrom } from "./dismiss";

describe("dismissTo", () => {
  it("goes back immediately when there is history", () => {
    vi.stubGlobal("window", {
      history: { length: 4 },
      location: { pathname: "/browse/abc", search: "" },
      setTimeout: () => 0,
    });
    const router = { back: vi.fn(), replace: vi.fn() };
    dismissTo(router as never, "/browse");
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("replaces with the fallback when back did not leave the overlay", () => {
    vi.stubGlobal("window", {
      history: { length: 3 },
      location: { pathname: "/browse/abc", search: "" },
      setTimeout: (fn: () => void) => {
        fn();
        return 0;
      },
    });
    const router = { back: vi.fn(), replace: vi.fn() };
    dismissTo(router as never, "/browse");
    expect(router.back).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/browse");
    vi.unstubAllGlobals();
  });

  it("replaces with the fallback when there is no history", () => {
    vi.stubGlobal("window", {
      history: { length: 1 },
      location: { pathname: "/browse/abc", search: "" },
      setTimeout,
    });
    const router = { back: vi.fn(), replace: vi.fn() };
    dismissTo(router as never, "/browse");
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/browse");
    vi.unstubAllGlobals();
  });

  it("sends every list back to its own section", () => {
    expect(profileLeaveTarget("shortlist")).toEqual({ href: "/app/shortlist", label: "Back to shortlist" });
    expect(profileLeaveTarget("blocked")).toEqual({ href: "/app/blocked", label: "Back to blocked" });
    expect(profileLeaveTarget("likes")).toEqual({ href: "/app/interests", label: "Back to interests" });
    expect(profileLeaveTarget("alerts")).toEqual({ href: "/app/alerts", label: "Back to alerts" });
    expect(profileLeaveTarget("chat")).toEqual({ href: "/app/chat", label: "Back to inbox" });
    expect(profileLeaveTarget()).toEqual({ href: "/browse", label: "Close" });
    expect(profileOpenHref("p1", "blocked")).toBe("/browse/p1?from=blocked");
    expect(withProfileFrom("/browse/p1", "alerts")).toBe("/browse/p1?from=alerts");
    expect(withProfileFrom("/app/chat", "alerts")).toBe("/app/chat");
  });
});
