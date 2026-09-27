import { safeNextPath } from "@/lib/auth/safe-next";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.error("[auth/google] ===== ROUTE HIT =====");

    const origin = request.nextUrl.origin;
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    console.error("[auth/google] origin:", origin, "next:", next);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.error("[auth/google] url set?:", !!url, "key set?:", !!key);

    if (!url || !key) {
      console.error("[auth/google] Missing env, redirecting to config error");
      return NextResponse.redirect(new URL("/login?error=config", origin));
    }

    console.error("[auth/google] Creating supabase client...");
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

    console.error("[auth/google] Calling signInWithOAuth...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });

    console.error("[auth/google] OAuth error?:", error?.message, "data.url?:", !!data?.url);

    if (error || !data.url) {
      console.error("[auth/google] OAuth failed");
      return NextResponse.redirect(new URL("/login?error=google", origin));
    }

    console.error("[auth/google] Redirecting to Google");
    const redirect = NextResponse.redirect(data.url);
    pending.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, {
        ...options,
        path: "/",
        sameSite: "lax",
      });
    });
    console.error("[auth/google] Cookies set, returning redirect");
    return redirect;
  } catch (err) {
    console.error("[auth/google] OUTER EXCEPTION:", err instanceof Error ? err.message : String(err));
    console.error("[auth/google] Stack:", err instanceof Error ? err.stack : "no stack");
    return NextResponse.json({ error: "Auth route error" }, { status: 500 });
  }
}
