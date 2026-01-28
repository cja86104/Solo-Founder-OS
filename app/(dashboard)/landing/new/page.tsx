import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateLandingPageForm } from "@/components/landing/create-landing-page-form";

export const metadata: Metadata = {
  title: "New Landing Page",
  description: "Create a new landing page",
};

export default function NewLandingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/landing"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Landing Pages
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Landing Page</h1>
        <p className="text-muted-foreground">
          Choose a template and get started
        </p>
      </div>

      <CreateLandingPageForm />
    </div>
  );
}
