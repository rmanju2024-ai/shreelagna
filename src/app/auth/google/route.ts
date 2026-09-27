import { safeNextPath } from "@/lib/auth/safe-next";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appendFileSync } from "fs";
import { join } from "path";

const logFile = join(process.cwd(), ".oauth_debug.log");

function log(msg: string) {
  const timestamp = new Date().toISOString();
  appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
  console.error(`[oauth] ${msg}`);
}

export async function GET(request: NextRequest) {
  try {
    log("=== ROUTE START ===");
    const origin = request.nextUrl.origin;
    log(`origin: ${origin}`);
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    log(`next: ${next}`);
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    log(`url exists: ${!!url}, key exists: ${!!key}`);

    if (!url || !key) {
      log(`ERROR: Missing config - url: ${!!url}, key: ${!!key}`);
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

    log("Creating Supabase client...");
    
    // Use the standard Next.js Supabase callback path
    // (Supabase middleware will handle this automatically)
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    log(`redirectTo: ${redirectTo}`);
    
    log("Calling signInWithOAuth...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });

    log(`OAuth response - error: ${error?.message || "none"}, hasUrl: ${!!data?.url}`);
    if (error || !data.url) {
      log(`ERROR: OAuth failed - ${error?.message || "no URL in response"}`);
      return NextResponse.json(
        { error: "OAuth failed", debug: { errorMsg: error?.message, hasUrl: !!data?.url } },
        { status: 500 }
      );
    }

    log(`Redirecting to: ${data.url}`);
    const redirect = NextResponse.redirect(data.url);
    pending.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, {
        ...options,
        path: "/",
        sameSite: "lax",
      });
    });
    log(`=== ROUTE SUCCESS - sending 307 ===`);
    return redirect;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    log(`CAUGHT ERROR: ${errorMsg}`);
    if (errorStack) log(`Stack: ${errorStack}`);
    return NextResponse.json(
      { 
        error: "Auth route exception", 
        debug: { 
          msg: errorMsg,
          stack: errorStack
        } 
      },
      { status: 500 }
    );
  }
}
