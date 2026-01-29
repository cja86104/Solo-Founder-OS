"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2,
  Sparkles,
  Component,
  FileText,
  StickyNote,
  Star,
  Copy,
  MoreHorizontal,
  Trash2,
  Edit,
  Globe,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  title: string;
  description: string | null;
  content: string;
  type: string | null;
  language: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  is_public: boolean | null;
  created_at: string | null;
  collection: { id: string; name: string; color: string | null; icon: string | null } | null;
}

const typeIcons = {
  snippet: Code2,
  prompt: Sparkles,
  component: Component,
  template: FileText,
  note: StickyNote,
};

const typeColors = {
  snippet: "text-blue-500 bg-blue-500/10",
  prompt: "text-purple-500 bg-purple-500/10",
  component: "text-green-500 bg-green-500/10",
  template: "text-orange-500 bg-orange-500/10",
  note: "text-yellow-500 bg-yellow-500/10",
};

export function VaultItemCard({ item }: { item: VaultItem }) {
  const router = useRouter();
  const supabase = createClient();
  const [isFavorite, setIsFavorite] = useState(item.is_favorite);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || Code2;
  const typeColor = typeColors[item.type as keyof typeof typeColors] || typeColors.snippet;

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
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item deleted");
      router.refresh();
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-md ${typeColor}`}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <Link href={`/vault/${item.id}`} className="min-w-0">
                <h3 className="font-semibold truncate hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </Link>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleToggleFavorite}
                className={isFavorite ? "text-yellow-500" : "text-muted-foreground"}
              >
                <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Content
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/vault/${item.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          {item.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {truncate(item.description, 100)}
            </p>
          )}

          {/* Code Preview */}
          <div className="relative">
            <pre className="text-xs bg-muted p-2 rounded-md overflow-hidden max-h-24">
              <code>{truncate(item.content, 200)}</code>
            </pre>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted to-transparent" />
          </div>
        </CardContent>

        <CardFooter className="pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {item.language && (
              <Badge variant="outline" className="text-xs">
                {item.language}
              </Badge>
            )}
            {item.collection && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.collection.color || undefined }}
                />
                {item.collection.name}
              </Badge>
            )}
            {item.is_public ? (
              <Globe className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(item.created_at!)}
          </span>
        </CardFooter>
      </Card>

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
