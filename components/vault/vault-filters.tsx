"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LANGUAGES, ITEM_TYPES } from "@/types/vault";

interface VaultFiltersProps {
  collections: Array<{
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    item_count: number | null;
  }>;
  currentFilters: {
    type?: string;
    language?: string;
    collection?: string;
    favorite?: string;
    search?: string;
  };
}

export function VaultFilters({ collections, currentFilters }: VaultFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentFilters.search || "");

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 when filtering
    startTransition(() => {
      router.push(`/vault?${params.toString()}`);
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/vault");
    });
    setSearchValue("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", searchValue || null);
  };

  const activeFilterCount = Object.values(currentFilters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search snippets..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  updateFilter("search", null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </form>

        {/* Type Filter */}
        <Select
          value={currentFilters.type || "all"}
          onValueChange={(value) => updateFilter("type", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ITEM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Language Filter */}
        <Select
          value={currentFilters.language || "all"}
          onValueChange={(value) => updateFilter("language", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Collection Filter */}
        <Select
          value={currentFilters.collection || "all"}
          onValueChange={(value) => updateFilter("collection", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: col.color || undefined }}
                  />
                  {col.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Favorites Toggle */}
        <Button
          variant={currentFilters.favorite === "true" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            updateFilter("favorite", currentFilters.favorite === "true" ? null : "true")
          }
        >
          ⭐ Favorites
        </Button>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {currentFilters.search}
              <button onClick={() => updateFilter("search", null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentFilters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {ITEM_TYPES.find((t) => t.value === currentFilters.type)?.label}
              <button onClick={() => updateFilter("type", null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentFilters.language && (
            <Badge variant="secondary" className="gap-1">
              Language: {LANGUAGES.find((l) => l.value === currentFilters.language)?.label}
              <button onClick={() => updateFilter("language", null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
