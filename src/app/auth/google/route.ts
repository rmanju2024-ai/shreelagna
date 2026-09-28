import { safeNextPath } from "@/lib/auth/safe-next";
import { trustSystemCa } from "@/lib/node/trust-system-ca";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  trustSystemCa();

  const origin = request.nextUrl.origin;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.error("[auth/google] start", {
    origin,
    next,
    hasUrl: Boolean(url),
    hasKey: Boolean(key),
    supabaseHost: url ? new URL(url).host : null,
  });

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  type AuthCookie = {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  };
  const pending: AuthCookie[] = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pending.push({ name, value, options });
        });
      },
    },
  });

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  console.error("[auth/google] oauth", {
    error: error?.message ?? null,
    hasUrl: Boolean(data?.url),
    redirectTo,
    oauthHost: data?.url ? new URL(data.url).host : null,
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  const redirect = NextResponse.redirect(data.url);
  pending.forEach(({ name, value, options }) => {
    redirect.cookies.set(name, value, {
      ...options,
      path: "/",
      sameSite: "lax",
      secure: origin.startsWith("https://"),
    });
  });
  return redirect;
}
