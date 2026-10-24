import { afterEach, describe, expect, it, vi } from "vitest";
import { canonicalSiteUrl, fixOAuthStartUrl, isVercelPreviewHost, publicSiteOrigin, supabaseAuthUrl } from "./site-url";

describe("site url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats vercel.app hosts as the test copy", () => {
    expect(isVercelPreviewHost("www.marriageconnect.in")).toBe(false);
    expect(isVercelPreviewHost("shreelagna-manju-cbbd.vercel.app")).toBe(true);
  });

  it("sends vercel hosts to the live domain", () => {
    expect(canonicalSiteUrl("/browse", "shreelagna-manju-cbbd.vercel.app")).toBe(
      "https://www.marriageconnect.in/browse",
    );
    expect(canonicalSiteUrl("/browse", "www.marriageconnect.in")).toBeNull();
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
});
