"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  BarChart,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { LandingPage } from "@/types/landing";
import type { Json } from "@/types/database";
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

const statusColors = {
  draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  published: "bg-green-500/10 text-green-500 border-green-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export function LandingPageCard({ page }: { page: LandingPage }) {
  const router = useRouter();
  const supabase = createClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageUrl = `${origin}/p/${page.slug}`;
  const conversionRate = (page.view_count || 0) > 0
    ? (((page.conversion_count || 0) / (page.view_count || 1)) * 100).toFixed(1)
    : "0";

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast.success("URL copied to clipboard!");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleDuplicate = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (!page.workspace_id) {
        toast.error("Cannot duplicate: workspace not found");
        return;
      }

      const { error } = await supabase.from("landing_pages").insert({
        workspace_id: page.workspace_id,
        user_id: user.id,
        title: `${page.title} (Copy)`,
        slug: `${page.slug}-copy-${Date.now()}`,
        description: page.description,
        template: page.template,
        content: page.content as unknown as Json,
        status: "draft",
      });

      if (error) throw error;

      toast.success("Page duplicated");
      router.refresh();
    } catch (error) {
      toast.error("Failed to duplicate page");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("landing_pages")
        .delete()
        .eq("id", page.id);

      if (error) throw error;

      toast.success("Page deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete page");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <Link href={`/landing/${page.id}`}>
                <h3 className="font-semibold truncate hover:text-primary transition-colors">
                  {page.title}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground truncate">
                /{page.slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors[page.status || 'draft']}>
                {page.status || 'draft'}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/landing/${page.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  {page.status === "published" && (
                    <DropdownMenuItem asChild>
                      <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Live
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleCopyUrl}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/landing/${page.id}/analytics`}>
                      <BarChart className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/landing/${page.id}/leads`}>
                      <Users className="mr-2 h-4 w-4" />
                      Leads
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
          {page.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {page.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted/50 rounded-md">
              <p className="text-lg font-semibold">{formatNumber(page.view_count || 0)}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <p className="text-lg font-semibold">{formatNumber(page.conversion_count || 0)}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-md">
              <p className="text-lg font-semibold">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Rate</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 text-xs text-muted-foreground justify-between">
          <span>Updated {formatRelativeTime(page.updated_at!)}</span>
          {page.status === "published" && (
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary"
            >
              <Eye className="h-3 w-3" />
              Preview
            </a>
          )}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete landing page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{page.title}&quot; and all its leads.
              This action cannot be undone.
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
