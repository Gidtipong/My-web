import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  SESSION_STARTED_COOKIE,
  getSessionMarkerCookieOptions,
} from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set(
        SESSION_STARTED_COOKIE,
        String(Date.now()),
        getSessionMarkerCookieOptions()
      );
      return response;
    }
  }

  // Return the user to an error page or back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
