import { describe, expect, it, vi } from "vitest";
import { dismissTo } from "./dismiss";

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
});
