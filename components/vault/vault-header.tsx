"use client";

import Link from "next/link";
import { Code2, Star, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VaultHeaderProps {
  totalItems: number;
  totalFavorites: number;
  totalCollections: number;
}

export function VaultHeader({
  totalItems,
  totalFavorites,
  totalCollections,
}: VaultHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Code Vault</h1>
          <p className="text-muted-foreground">
            Your personal library of code snippets, prompts, and components
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/vault/collections">
            <Button variant="outline">
              <FolderOpen className="mr-2 h-4 w-4" />
              Collections
            </Button>
          </Link>
          <Link href="/vault/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Code2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalFavorites}</p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FolderOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCollections}</p>
              <p className="text-sm text-muted-foreground">Collections</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
