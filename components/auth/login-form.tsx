"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/dashboard";
  // Prevent open redirect — only allow relative paths starting with /
  const redirectTo =
    redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error("Invalid email or password");
        } else if (error.message === "Email not confirmed") {
          toast.error("Please verify your email before logging in");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#F2EAD8",
            marginBottom: 8,
            lineHeight: 1.1,
          }}
        >
          Welcome back.
        </h1>
        <p style={{ fontSize: 14, color: "#A89070", lineHeight: 1.6 }}>
          Sign in to your Founders Helm account.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FormLabel
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C4A882",
                    letterSpacing: "0.02em",
                  }}
                >
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className="
                      bg-[#3A2010] border-[rgba(196,168,130,0.20)] text-[#F2EAD8]
                      placeholder:text-[#5A3E2E]
                      focus-visible:ring-[#C75B1A] focus-visible:ring-1
                      focus-visible:border-[#C75B1A]
                      hover:border-[rgba(196,168,130,0.35)]
                      h-11 px-4 rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                    {...field}
                  />
                </FormControl>
                <FormMessage style={{ fontSize: 12, color: "#C75B1A" }} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <FormLabel
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#C4A882",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    style={{
                      fontSize: 12,
                      color: "#A89070",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color = "#F2EAD8")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = "#A89070")
                    }
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="
                      bg-[#3A2010] border-[rgba(196,168,130,0.20)] text-[#F2EAD8]
                      placeholder:text-[#5A3E2E]
                      focus-visible:ring-[#C75B1A] focus-visible:ring-1
                      focus-visible:border-[#C75B1A]
                      hover:border-[rgba(196,168,130,0.35)]
                      h-11 px-4 rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                    {...field}
                  />
                </FormControl>
                <FormMessage style={{ fontSize: 12, color: "#C75B1A" }} />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 10,
              background: isLoading ? "#8A3F13" : "#C75B1A",
              color: "#F2EAD8",
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s",
              marginTop: 4,
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#B34E16";
            }}
            onMouseLeave={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#C75B1A";
            }}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div
        style={{
          margin: "28px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: "rgba(196,168,130,0.12)",
          }}
        />
        <span style={{ fontSize: 12, color: "#5A3E2E", fontWeight: 500 }}>
          New to Founders Helm?
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "rgba(196,168,130,0.12)",
          }}
        />
      </div>

      {/* Sign up link */}
      <Link
        href="/signup"
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          padding: "11px 0",
          borderRadius: 10,
          border: "1.5px solid rgba(196,168,130,0.20)",
          color: "#C4A882",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(196,168,130,0.40)";
          (e.currentTarget as HTMLElement).style.color = "#F2EAD8";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(196,168,130,0.20)";
          (e.currentTarget as HTMLElement).style.color = "#C4A882";
        }}
      >
        Create a free account →
      </Link>
    </div>
  );
}
