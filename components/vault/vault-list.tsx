"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { VaultItemCard } from "@/components/vault/vault-item-card";
import { Button } from "@/components/ui/button";

interface VaultItem {
  id: string;
  title: string;
  description: string | null;
  content: string;
  type: string | null;
  language: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  is_public: boolean | null;
  use_count: number | null;
  created_at: string | null;
  collection: { id: string; name: string; color: string | null; icon: string | null } | null;
}

interface VaultListProps {
  items: VaultItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export function VaultList({ items, totalCount, currentPage, pageSize }: VaultListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/vault?${params.toString()}`);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No items found</h3>
        <p className="text-muted-foreground mb-4">
          {searchParams.toString()
            ? "Try adjusting your filters or search query"
            : "Create your first snippet, prompt, or component"}
        </p>
        <Link href="/vault/new">
          <Button>Create New Item</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <VaultItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(currentPage - 1)}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(currentPage + 1)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
