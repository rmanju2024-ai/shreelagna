import { supabaseAuthUrl } from "@/lib/site-url";
import { NextResponse, type NextRequest } from "next/server";

function toSupabase(request: NextRequest) {
  return NextResponse.redirect(supabaseAuthUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`));
}

export function GET(request: NextRequest) {
  return toSupabase(request);
}

export function POST(request: NextRequest) {
  return toSupabase(request);
}
