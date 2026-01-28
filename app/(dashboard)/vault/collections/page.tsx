import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { CollectionCard } from "@/components/vault/collection-card";
import { CreateCollectionDialog } from "@/components/vault/create-collection-dialog";

export const metadata: Metadata = {
  title: "Collections - Code Vault",
  description: "Organize your code snippets into collections",
};

export default async function CollectionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: collections } = await supabase
    .from("vault_collections")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/vault"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Vault
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize your snippets, prompts, and components
          </p>
        </div>
        <CreateCollectionDialog />
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No collections yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first collection to organize your vault items
          </p>
          <CreateCollectionDialog />
        </div>
      )}
    </div>
  );
}
