import { safeNextPath } from "@/lib/auth/safe-next";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appendFileSync } from "fs";

const logFile = "/tmp/.oauth_debug.log";

function log(msg: string | any, data?: any) {
  const timestamp = new Date().toISOString();
  let fullMsg = `[${timestamp}] `;
  
  if (typeof msg === "string") {
    fullMsg += msg;
    if (data) {
      fullMsg += ` | ${JSON.stringify(data, null, 2)}`;
    }
  } else {
    fullMsg += JSON.stringify(msg, null, 2);
  }
  
  try {
    appendFileSync(logFile, fullMsg + "\n");
  } catch (e) {
    console.error("Failed to write log", e);
  }
  console.error(`[oauth-google]`, typeof msg === "string" ? msg : "", msg);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  log("========================================");
  log("🚀 ROUTE START");
  log(`Method: ${request.method}`);
  log(`URL: ${request.url}`);
  
  try {
    // Log request headers
    log("Request Headers:");
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    log(JSON.stringify(headersObj, null, 2));

    // Extract parameters
    const origin = request.nextUrl.origin;
    log(`✓ origin extracted: ${origin}`);
    
    const nextParam = request.nextUrl.searchParams.get("next");
    log(`✓ next param from URL: ${nextParam}`);
    
    const next = safeNextPath(nextParam);
    log(`✓ next sanitized: ${next}`);
    
    // Check environment variables
    log("📋 Checking environment variables...");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    log(`  - NEXT_PUBLIC_SUPABASE_URL exists: ${!!url}`);
    if (url) log(`    Value: ${url}`);
    
    log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY exists: ${!!key}`);
    if (key) log(`    First 20 chars: ${key.substring(0, 20)}...`);
    
    log(`  - SUPABASE_SERVICE_ROLE_KEY exists: ${!!serviceKey}`);
    if (serviceKey) log(`    First 20 chars: ${serviceKey.substring(0, 20)}...`);

    if (!url || !key) {
      log("❌ ERROR: Missing Supabase credentials");
      log({
        urlMissing: !url,
        keyMissing: !key,
      });
      return NextResponse.json(
        { 
          error: "Missing Supabase config", 
          debug: { 
            url: !!url, 
            key: !!key,
            timestamp: new Date().toISOString()
          } 
        },
        { status: 500 }
      );
    }

    // Create cookie store
    log("📦 Setting up cookie storage...");
    type AuthCookie = {
      name: string;
      value: string;
      options?: Parameters<NextResponse["cookies"]["set"]>[2];
    };
    const pending: AuthCookie[] = [];
    
    log("🔐 Creating Supabase client...");
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          const allCookies = request.cookies.getAll();
          log(`  getAll() called - returning ${allCookies.length} cookies`);
          return allCookies;
        },
        setAll(cookiesToSet) {
          log(`  setAll() called with ${cookiesToSet.length} cookies to set`);
          cookiesToSet.forEach(({ name, value, options }) => {
            log(`    - Setting cookie: ${name}`);
            pending.push({ name, value, options });
          });
        },
      },
    });
    log("✓ Supabase client created");

    // Prepare OAuth request
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    log(`🔗 OAuth Redirect URI configured:`);
    log(`  Full redirectTo: ${redirectTo}`);
    log(`  Provider: google`);
    log(`  Query params: prompt=select_account`);
    
    // Call OAuth
    log("📡 Calling supabase.auth.signInWithOAuth()...");
    const oauthStartTime = Date.now();
    
    let data, error;
    try {
      const response = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      data = response.data;
      error = response.error;
      log(`✓ OAuth call completed in ${Date.now() - oauthStartTime}ms`);
    } catch (oauthErr) {
      log(`❌ OAuth call threw exception:`);
      log({
        error: oauthErr instanceof Error ? oauthErr.message : String(oauthErr),
        stack: oauthErr instanceof Error ? oauthErr.stack : undefined,
      });
      throw oauthErr;
    }

    // Log OAuth response
    log("📋 OAuth Response:");
    if (error) {
      log(`  ❌ Error: ${error.message}`);
      log(`     Code: ${error.code}`);
      log(`     Status: ${error.status}`);
    } else {
      log(`  ✓ No error`);
    }
    
    if (data) {
      log(`  ✓ Data returned: ${!!data}`);
      if (data.url) {
        log(`    - URL: ${data.url.substring(0, 100)}...`);
      } else {
        log(`    ❌ No URL in data`);
      }
      if (data.provider) {
        log(`    - Provider: ${data.provider}`);
      }
    } else {
      log(`  ❌ No data returned`);
    }

    // Check if we have a valid URL to redirect to
    if (error) {
      log(`❌ ERROR: OAuth error returned`);
      log({
        errorMsg: error.message,
        errorCode: error.code,
        errorStatus: error.status,
      });
      return NextResponse.json(
        { 
          error: "OAuth failed", 
          debug: { 
            errorMsg: error.message, 
            errorCode: error.code,
            hasData: !!data,
            hasUrl: !!data?.url,
            timestamp: new Date().toISOString()
          } 
        },
        { status: 500 }
      );
    }

    if (!data?.url) {
      log(`❌ ERROR: No URL in OAuth response`);
      log({
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        hasUrl: !!data?.url,
      });
      return NextResponse.json(
        { 
          error: "OAuth returned no URL", 
          debug: { 
            hasData: !!data,
            hasUrl: !!data?.url,
            timestamp: new Date().toISOString()
          } 
        },
        { status: 500 }
      );
    }

    // Create redirect response
    log(`✅ Valid OAuth URL obtained`);
    log(`🔀 Creating redirect response...`);
    log(`   Redirect target: ${data.url.substring(0, 150)}...`);
    
    const redirect = NextResponse.redirect(data.url);
    log(`✓ NextResponse.redirect() created`);

    // Set pending cookies
    log(`📌 Setting ${pending.length} pending cookies...`);
    pending.forEach(({ name, value, options }, idx) => {
      log(`   [${idx + 1}/${pending.length}] Setting: ${name}`);
      try {
        redirect.cookies.set(name, value, {
          ...options,
          path: "/",
          sameSite: "lax",
        });
        log(`     ✓ Cookie set successfully`);
      } catch (cookieErr) {
        log(`     ❌ Failed to set cookie: ${cookieErr}`);
      }
    });

    const totalTime = Date.now() - startTime;
    log(`✅ ROUTE SUCCESS - Returning 307 redirect`);
    log(`⏱️  Total execution time: ${totalTime}ms`);
    log("========================================");
    
    return redirect;
    
  } catch (err) {
    const totalTime = Date.now() - startTime;
    
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    log(`❌ CAUGHT TOP-LEVEL EXCEPTION`);
    log({
      message: errorMsg,
      stack: errorStack,
      executionTime: totalTime,
      timestamp: new Date().toISOString(),
    });
    log("========================================");
    
    return NextResponse.json(
      { 
        error: "Auth route exception", 
        debug: { 
          msg: errorMsg,
          stack: errorStack,
          executionTime: totalTime,
          timestamp: new Date().toISOString()
        } 
      },
      { status: 500 }
    );
  }
}
