import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VaultItemForm } from "@/components/vault/vault-item-form";
import { VaultItemView } from "@/components/vault/vault-item-view";
import type { VaultItemWithCollection, VaultCollection } from "@/types/vault";
import type { Database } from "@/types/database";

interface VaultItemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export async function generateMetadata({
  params,
}: VaultItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("vault_items")
    .select("title")
    .eq("id", id)
    .single<{ title: string }>();

  return {
    title: item?.title || "Item Not Found",
    description: `View ${item?.title || "item"} in Code Vault`,
  };
}

export default async function VaultItemPage({
  params,
  searchParams,
}: VaultItemPageProps) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch item
  const { data: item, error } = await supabase
    .from("vault_items")
    .select("*, collection:vault_collections(id, name, color, icon)")
    .eq("id", id)
    .single<VaultItemWithCollection>();

  if (error || !item) {
    notFound();
  }

  // Check ownership for editing
  const isOwner = item.user_id === user?.id;

  if (!isOwner && !item.is_public) {
    notFound();
  }

  // Increment view count
  if (isOwner) {
    // Note: Using type assertion due to Supabase client type inference limitations
    const updateData: Database["public"]["Tables"]["vault_items"]["Update"] = {
      use_count: (item.use_count || 0) + 1,
    };
    await supabase
      .from("vault_items")
      .update(updateData as unknown as never)
      .eq("id", id);
  }

  // Fetch collections for edit form
  const { data: collections } = await supabase
    .from("vault_collections")
    .select("id, name, color, icon")
    .eq("user_id", user!.id)
    .order("name")
    .returns<Pick<VaultCollection, 'id' | 'name' | 'color' | 'icon'>[]>();

  const isEditMode = edit === "true" && isOwner;

  if (isEditMode) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Edit Item</h1>
          <p className="text-muted-foreground">
            Update your {item.type}
          </p>
        </div>
        <VaultItemForm
          collections={collections || []}
          initialData={{
            id: item.id,
            title: item.title,
            description: item.description,
            content: item.content,
            type: item.type,
            language: item.language,
            tags: item.tags,
            collection_id: item.collection_id,
            is_public: item.is_public,
          }}
        />
      </div>
    );
  }

  return (
    <VaultItemView
      item={item}
      isOwner={isOwner}
    />
  );
}
