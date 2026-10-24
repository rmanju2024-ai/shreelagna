import { type NextRequest, NextResponse } from "next/server";
import { canonicalSiteUrl, supabaseAuthUrl } from "@/lib/site-url";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/auth/v1")) {
    return NextResponse.redirect(supabaseAuthUrl(`${path}${request.nextUrl.search}`));
  }
  const live = canonicalSiteUrl(`${path}${request.nextUrl.search}`, request.nextUrl.host);
  if (live) {
    return NextResponse.redirect(live, 308);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
