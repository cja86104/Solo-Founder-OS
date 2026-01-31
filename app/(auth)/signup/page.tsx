import { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Founders Helm account",
};

export default function SignupPage() {
  return <SignupForm />;
}