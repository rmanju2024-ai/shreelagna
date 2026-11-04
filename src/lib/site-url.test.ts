import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canonicalSiteUrl,
  fixOAuthStartUrl,
  isVercelPreviewHost,
  publicSiteOrigin,
  requestSiteOrigin,
  supabaseAuthUrl,
} from "./site-url";

describe("site url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats vercel.app hosts as the test copy", () => {
    expect(isVercelPreviewHost("www.marriageconnect.in")).toBe(false);
    expect(isVercelPreviewHost("shreelagna-manju-cbbd.vercel.app")).toBe(true);
  });

  it("keeps vercel.app on itself and only folds the bare live domain onto www", () => {
    expect(canonicalSiteUrl("/browse", "shreelagna.vercel.app")).toBeNull();
    expect(canonicalSiteUrl("/browse", "shreelagna-manju-cbbd.vercel.app")).toBeNull();
    expect(canonicalSiteUrl("/browse", "www.marriageconnect.in")).toBeNull();
    expect(canonicalSiteUrl("/browse", "marriageconnect.in")).toBe("https://www.marriageconnect.in/browse");
  });

  it("keeps Google sign-in on the vercel host that was opened", () => {
    expect(
      requestSiteOrigin({ nextUrl: { protocol: "https:", host: "shreelagna.vercel.app" } }),
    ).toBe("https://shreelagna.vercel.app");
    expect(
      requestSiteOrigin({ nextUrl: { protocol: "https:", host: "www.marriageconnect.in" } }),
    ).toBe("https://www.marriageconnect.in");
  });

  it("honours NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://marriageconnect.in/");
    expect(publicSiteOrigin()).toBe("https://marriageconnect.in");
  });

  it("rewrites a same-site auth URL onto supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    expect(fixOAuthStartUrl("https://marriageconnect.in/auth/v1/authorize?x=1")).toBe(
      "https://abcd.supabase.co/auth/v1/authorize?x=1",
    );
    expect(supabaseAuthUrl("/auth/v1/authorize?x=1")).toBe("https://abcd.supabase.co/auth/v1/authorize?x=1");
  });

  it("does not treat the public website as supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://www.marriageconnect.in");
    expect(supabaseAuthUrl("/auth/v1/authorize")).toBe(
      "https://polctldhftsztcjwsvel.supabase.co/auth/v1/authorize",
    );
  });
});
