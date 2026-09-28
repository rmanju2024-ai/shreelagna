import { safeNextPath } from "@/lib/auth/safe-next";
import { trustSystemCa } from "@/lib/node/trust-system-ca";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isNetworkError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return m.includes("fetch") || m.includes("certificate") || m.includes("ssl");
}

async function exchange(
  url: string,
  key: string,
  request: NextRequest,
  code: string,
  dest: string,
) {
  const redirect = NextResponse.redirect(new URL(dest, request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirect.cookies.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: request.nextUrl.protocol === "https:",
          });
        });
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return { redirect, error };
}

export async function GET(request: NextRequest) {
  trustSystemCa();

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");
  const dest = safeNextPath(searchParams.get("next"));

  console.error("[auth/callback] hit", {
    origin,
    dest,
    hasCode: Boolean(code),
    oauthError,
    oauthDesc,
  });

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=google`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  try {
    let last = await exchange(url, key, request, code, dest);
    if (isNetworkError(last.error?.message)) {
      last = await exchange(url, key, request, code, dest);
    }
    if (last.error) {
      console.error("[auth/callback] exchange failed", last.error.message);
      const safe = isNetworkError(last.error.message)
        ? "network"
        : encodeURIComponent(last.error.message.slice(0, 80));
      return NextResponse.redirect(`${origin}/login?error=${safe}`);
    }
    console.error("[auth/callback] success", dest);
    return last.redirect;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    console.error("[auth/callback] exception", message);
    const safe = isNetworkError(message) ? "network" : "auth";
    return NextResponse.redirect(`${origin}/login?error=${safe}`);
  }
}
