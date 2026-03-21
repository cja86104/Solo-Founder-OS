"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
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

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  async function onSubmit(data: SignupInput) {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign up the user — the database trigger handles profile, subscription, and workspace creation
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error("An account with this email already exists");
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        toast.success("Check your email to verify your account");
        router.push("/verify-email");
      } else {
        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = `
    bg-[#3A2010] border-[rgba(196,168,130,0.20)] text-[#F2EAD8]
    placeholder:text-[#5A3E2E]
    focus-visible:ring-[#C75B1A] focus-visible:ring-1
    focus-visible:border-[#C75B1A]
    hover:border-[rgba(196,168,130,0.35)]
    h-11 px-4 rounded-lg
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
  `;

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#C4A882",
    letterSpacing: "0.02em",
  };

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
          Start your free trial.
        </h1>
        <p style={{ fontSize: 14, color: "#A89070", lineHeight: 1.6 }}>
          14 days free. No credit card required.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FormLabel style={labelStyle}>Full name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Chris Allen"
                    autoComplete="name"
                    disabled={isLoading}
                    className={inputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage style={{ fontSize: 12, color: "#C75B1A" }} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FormLabel style={labelStyle}>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className={inputClass}
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
                <FormLabel style={labelStyle}>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className={inputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage style={{ fontSize: 12, color: "#C75B1A" }} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FormLabel style={labelStyle}>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className={inputClass}
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
            {isLoading ? "Creating account…" : "Create free account"}
          </Button>
        </form>
      </Form>

      {/* Terms */}
      <p
        style={{
          marginTop: 16,
          textAlign: "center",
          fontSize: 12,
          color: "#5A3E2E",
          lineHeight: 1.6,
        }}
      >
        By creating an account you agree to our{" "}
        <Link
          href="/terms"
          style={{ color: "#A89070", textDecoration: "underline" }}
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          style={{ color: "#A89070", textDecoration: "underline" }}
        >
          Privacy Policy
        </Link>
        .
      </p>

      {/* Divider */}
      <div
        style={{
          margin: "24px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "rgba(196,168,130,0.12)" }} />
        <span style={{ fontSize: 12, color: "#5A3E2E", fontWeight: 500 }}>
          Already have an account?
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(196,168,130,0.12)" }} />
      </div>

      {/* Sign in link */}
      <Link
        href="/login"
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
        Sign in instead →
      </Link>
    </div>
  );
}
