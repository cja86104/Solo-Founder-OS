import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") || "/dashboard";
  // Prevent open redirect -- only allow relative paths starting with /
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createClient();

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (data.user) {
      // Check if profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create profile from OAuth data
        // Note: Using type assertion due to Supabase client type inference limitations
        const profileData: Database["public"]["Tables"]["profiles"]["Insert"] = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name ||
                     data.user.user_metadata?.name ||
                     data.user.email?.split("@")[0] ||
                     "User",
          avatar_url: data.user.user_metadata?.avatar_url ||
                      data.user.user_metadata?.picture ||
                      null,
        };
        const { error: profileError } = await supabase
          .from("profiles")
          .insert(profileData as unknown as never);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // Create trial subscription for new users (14-day free trial)
        const subscriptionData: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
          user_id: data.user.id,
          plan: "trial",
          status: "trialing",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .insert(subscriptionData as unknown as never);

        if (subscriptionError) {
          console.error("Subscription creation error:", subscriptionError);
        }
      }
    }

    // Redirect to the intended destination
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code present, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
