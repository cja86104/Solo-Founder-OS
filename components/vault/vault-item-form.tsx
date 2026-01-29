"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { vaultItemSchema, type VaultItemInput } from "@/lib/validations/vault";
import { LANGUAGES, ITEM_TYPES, COLLECTION_COLORS } from "@/types/vault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface VaultItemFormProps {
  collections: Array<{ id: string; name: string; color: string | null; icon: string | null }>;
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    type: string | null;
    language: string | null;
    tags: string[] | null;
    collection_id: string | null;
    is_public: boolean | null;
  };
}

export function VaultItemForm({ collections: initialCollections, initialData }: VaultItemFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { currentWorkspace } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [collections, setCollections] = useState(initialCollections);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState<string>(COLLECTION_COLORS[0]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const isEditing = !!initialData;

  const form = useForm<VaultItemInput>({
    resolver: zodResolver(vaultItemSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      content: initialData?.content || "",
      type: (initialData?.type as VaultItemInput["type"]) || "snippet",
      language: initialData?.language || "",
      tags: initialData?.tags || [],
      collection_id: initialData?.collection_id || undefined,
      is_public: initialData?.is_public || false,
    },
  });

  const watchType = form.watch("type");
  const watchTags = form.watch("tags") || [];

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !watchTags.includes(tag) && watchTags.length < 10) {
      form.setValue("tags", [...watchTags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      watchTags.filter((t) => t !== tagToRemove)
    );
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsCreatingCollection(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (!currentWorkspace) {
        toast.error("No workspace selected");
        return;
      }

      const { data, error } = await (supabase.from("vault_collections") as any)
        .insert({
          workspace_id: currentWorkspace.id,
          user_id: user.id,
          name: newCollectionName.trim(),
          color: newCollectionColor,
          is_public: false,
        })
        .select("id, name, color, icon")
        .single();

      if (error) throw error;

      // Add to local list and auto-select it
      setCollections((prev) => [...prev, data]);
      form.setValue("collection_id", data.id);

      toast.success(`Collection "${data.name}" created`);
      setShowNewCollection(false);
      setNewCollectionName("");
      setNewCollectionColor(COLLECTION_COLORS[0]);
    } catch (error) {
      toast.error("Failed to create collection");
      console.error(error);
    } finally {
      setIsCreatingCollection(false);
    }
  };

  async function onSubmit(data: VaultItemInput) {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (!currentWorkspace) {
        toast.error("No workspace selected");
        return;
      }

      const itemData = {
        workspace_id: currentWorkspace.id,
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        content: data.content,
        type: data.type,
        language: data.language || null,
        tags: data.tags || [],
        collection_id: data.collection_id || null,
        is_public: data.is_public || false,
      };

      if (isEditing) {
        const { error } = await (supabase
          .from("vault_items") as any)
          .update(itemData)
          .eq("id", initialData.id);

        if (error) {
          console.error("Vault update error:", error.message, error.code, error.details, error.hint);
          toast.error(error.message || "Failed to update item");
          return;
        }
        toast.success("Item updated successfully");
      } else {
        const { error } = await (supabase.from("vault_items") as any).insert(itemData);

        if (error) {
          console.error("Vault insert error:", error.message, error.code, error.details, error.hint);
          toast.error(error.message || "Failed to create item");
          return;
        }
        toast.success("Item created successfully");
      }

      router.push("/vault");
      router.refresh();
    } catch (error: any) {
      const msg = error?.message || "Unknown error";
      toast.error(isEditing ? `Failed to update: ${msg}` : `Failed to create: ${msg}`);
      console.error("Vault submit error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., React useDebounce Hook"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type & Language */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchType === "snippet" || watchType === "component") && (
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this do? When would you use it?"
                      className="min-h-[80px]"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        watchType === "prompt"
                          ? "Enter your AI prompt..."
                          : "Paste your code here..."
                      }
                      className="min-h-[200px] font-mono text-sm"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Collection */}
            <FormField
              control={form.control}
              name="collection_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection (optional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No collection</SelectItem>
                        {collections.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: col.color || undefined }}
                              />
                              {col.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowNewCollection(true)}
                      disabled={isLoading}
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Collection Dialog */}
            <Dialog open={showNewCollection} onOpenChange={setShowNewCollection}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                  <DialogDescription>
                    Create a new collection to organize your vault items
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <FormLabel>Name</FormLabel>
                    <Input
                      placeholder="e.g., React Hooks, AI Prompts"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      disabled={isCreatingCollection}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateCollection();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Color</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {COLLECTION_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewCollectionColor(color)}
                          className={cn(
                            "h-8 w-8 rounded-full transition-transform hover:scale-110",
                            newCollectionColor === color && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCollection(false)}
                    disabled={isCreatingCollection}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateCollection}
                    disabled={isCreatingCollection || !newCollectionName.trim()}
                  >
                    {isCreatingCollection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags (optional)</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  disabled={isLoading || watchTags.length >= 10}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={isLoading || watchTags.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {watchTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {watchTags.length}/10 tags
              </p>
            </div>

            {/* Public Toggle */}
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Make Public</FormLabel>
                    <FormDescription>
                      Allow others to view and copy this item
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Item" : "Create Item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
