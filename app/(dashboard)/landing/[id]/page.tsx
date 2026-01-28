import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPageEditor } from "@/components/landing/landing-page-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLandingPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !page) {
    notFound();
  }

  return <LandingPageEditor page={page as any} />;
}
