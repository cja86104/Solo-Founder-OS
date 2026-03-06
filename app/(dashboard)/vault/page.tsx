import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { VaultHeader } from "@/components/vault/vault-header";
import { VaultList } from "@/components/vault/vault-list";
import { VaultFilters } from "@/components/vault/vault-filters";
import { SkeletonCard } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Code Vault",
  description: "Your personal library of code snippets, prompts, and components",
};

interface VaultPageProps {
  searchParams: Promise<{
    type?: string;
    language?: string;
    collection?: string;
    favorite?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function VaultPage({ searchParams }: VaultPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch collections for filter dropdown
  const { data: collections } = await supabase
    .from("vault_collections")
    .select("id, name, color, icon, item_count")
    .eq("user_id", user.id)
    .order("name");

  // Build query
  let query = supabase
    .from("vault_items")
    .select("*, collection:vault_collections(id, name, color, icon)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (params.type) {
    query = query.eq("type", params.type);
  }
  if (params.language) {
    query = query.eq("language", params.language);
  }
  if (params.collection) {
    query = query.eq("collection_id", params.collection);
  }
  if (params.favorite === "true") {
    query = query.eq("is_favorite", true);
  }
  if (params.search) {
    query = query.textSearch("fts", params.search, { type: "websearch" });
  }

  // Pagination
  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: items, count } = await query
    .range(from, to)
    .returns<Array<{
      id: string;
      title: string;
      description: string | null;
      content: string;
      type: string;
      language: string | null;
      tags: string[];
      is_favorite: boolean;
      is_public: boolean;
      use_count: number | null;
      created_at: string;
      collection: { id: string; name: string; color: string; icon: string } | null;
    }>>();

  // Get stats
  const { count: totalItems } = await supabase
    .from("vault_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: totalFavorites } = await supabase
    .from("vault_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_favorite", true);

  return (
    <div className="space-y-6">
      <VaultHeader
        totalItems={totalItems || 0}
        totalFavorites={totalFavorites || 0}
        totalCollections={collections?.length || 0}
      />

      <VaultFilters
        collections={collections || []}
        currentFilters={{
          type: params.type,
          language: params.language,
          collection: params.collection,
          favorite: params.favorite,
          search: params.search,
        }}
      />

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
        <VaultList
          items={items || []}
          totalCount={count || 0}
          currentPage={page}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}
