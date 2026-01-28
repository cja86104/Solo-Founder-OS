"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types/database";

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      setUser(currentUser);

      if (currentUser) {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        setProfile(profileData);

        // Fetch subscription
        const { data: subscriptionData, error: subscriptionError } =
          await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", currentUser.id)
            .single();

        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          throw subscriptionError;
        }

        setSubscription(subscriptionData);
      } else {
        setProfile(null);
        setSubscription(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"));
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setSubscription(null);

      // Redirect to home
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to sign out"));
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth state changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserData();
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [fetchUserData, supabase.auth]);

  return {
    user,
    profile,
    subscription,
    isLoading,
    error,
    refresh: fetchUserData,
    signOut,
  };
}
