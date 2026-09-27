import { safeNextPath } from "@/lib/auth/safe-next";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { error: "Missing Supabase config", debug: { url: !!url, key: !!key } },
        { status: 500 }
      );
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

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { error: "OAuth failed", debug: { errorMsg: error?.message, hasUrl: !!data?.url } },
        { status: 500 }
      );
    }

    const redirect = NextResponse.redirect(data.url);
    pending.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, {
        ...options,
        path: "/",
        sameSite: "lax",
      });
    });
    return redirect;
  } catch (err) {
    return NextResponse.json(
      { 
        error: "Auth route exception", 
        debug: { 
          msg: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        } 
      },
      { status: 500 }
    );
  }
}
