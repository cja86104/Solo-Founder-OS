import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VaultItemForm } from "@/components/vault/vault-item-form";

export const metadata: Metadata = {
  title: "New Item - Code Vault",
  description: "Create a new code snippet, prompt, or component",
};

export default async function NewVaultItemPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch collections for dropdown
  const { data: collections } = await supabase
    .from("vault_collections")
    .select("id, name, color, icon")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Item</h1>
        <p className="text-muted-foreground">
          Add a new code snippet, AI prompt, component, or note to your vault
        </p>
      </div>

      <VaultItemForm collections={collections || []} />
    </div>
  );
}
