"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Edit,
  Star,
  Trash2,
  Globe,
  Lock,
  Eye,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES, ITEM_TYPES } from "@/types/vault";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VaultItem {
  id: string;
  user_id: string;
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
  updated_at: string | null;
  collection: { id: string; name: string; color: string | null; icon: string | null } | null;
}

interface VaultItemViewProps {
  item: VaultItem;
  isOwner: boolean;
}

export function VaultItemView({ item, isOwner }: VaultItemViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isFavorite, setIsFavorite] = useState(item.is_favorite);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeLabel = ITEM_TYPES.find((t) => t.value === item.type)?.label || item.type;
  const languageLabel = LANGUAGES.find((l) => l.value === item.language)?.label || item.language;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      toast.success("Copied to clipboard!");

      // Update copy count
      await (supabase
        .from("vault_items") as any)
        .update({ use_count: ((item as any).use_count || 0) + 1 })
        .eq("id", item.id);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleToggleFavorite = async () => {
    if (!isOwner) return;

    const newValue = !isFavorite;
    setIsFavorite(newValue);

    const { error } = await (supabase
      .from("vault_items") as any)
      .update({ is_favorite: newValue })
      .eq("id", item.id);

    if (error) {
      setIsFavorite(!newValue);
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const { error } = await (supabase
      .from("vault_items") as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item deleted");
      router.push("/vault");
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <Link
              href="/vault"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Vault
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{typeLabel}</Badge>
              {languageLabel && <Badge variant="secondary">{languageLabel}</Badge>}
              {item.collection && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.collection.color || undefined }}
                  />
                  {item.collection.name}
                </Badge>
              )}
              {item.is_public ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Public
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className={isFavorite ? "text-yellow-500" : ""}
                >
                  <Star className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "Favorited" : "Favorite"}
                </Button>
                <Link href={`/vault/${item.id}?edit=true`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium">Content</span>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{item.content}</code>
            </pre>
          </CardContent>
        </Card>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Link key={tag} href={`/vault?search=${tag}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(item.created_at!)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(item.updated_at!)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Views</p>
                  <p className="text-sm text-muted-foreground">{item.use_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Copies</p>
                  <p className="text-sm text-muted-foreground">{item.use_count || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move &quot;{item.title}&quot; to trash. You can restore it within 30 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
