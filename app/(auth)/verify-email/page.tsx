import { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground">
          We&apos;ve sent you a verification link. Please check your inbox and click the link to verify your email address.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-medium mb-2">Didn&apos;t receive the email?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Wait a few minutes and try again</li>
          </ul>
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to login
          </Button>
        </Link>
      </div>
    </div>
  );
}
