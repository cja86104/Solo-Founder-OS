"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { LandingPage } from "@/types/landing";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PageSettingsPanelProps {
  page: LandingPage;
  onUpdate: (updates: Partial<LandingPage>) => void;
}

export function PageSettingsPanel({ page, onUpdate }: PageSettingsPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: page.title,
    slug: page.slug,
    description: page.description || "",
    meta_title: page.meta_title || "",
    meta_description: page.meta_description || "",
    og_image: page.og_image || "",
    custom_css: page.custom_css || "",
    password: page.password || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await (supabase
        .from("landing_pages") as any)
        .update({
          title: formData.title,
          slug: formData.slug,
          description: formData.description || null,
          meta_title: formData.meta_title || null,
          meta_description: formData.meta_description || null,
          og_image: formData.og_image || null,
          custom_css: formData.custom_css || null,
          password: formData.password || null,
        })
        .eq("id", page.id);

      if (error) throw error;

      onUpdate(formData);
      toast.success("Settings saved");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic page information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-1">/p/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", slugify(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="A brief description of this page..."
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>Optimize for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">
              Meta Title
              <span className="text-xs text-muted-foreground ml-2">
                {formData.meta_title.length}/70
              </span>
            </Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => handleChange("meta_title", e.target.value)}
              placeholder={formData.title}
              maxLength={70}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">
              Meta Description
              <span className="text-xs text-muted-foreground ml-2">
                {formData.meta_description.length}/160
              </span>
            </Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => handleChange("meta_description", e.target.value)}
              placeholder="A compelling description for search results..."
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="og_image">Social Share Image URL</Label>
            <Input
              id="og_image"
              type="url"
              value={formData.og_image}
              onChange={(e) => handleChange("og_image", e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 1200x630 pixels
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>Custom styling and access control</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom_css">Custom CSS</Label>
            <Textarea
              id="custom_css"
              value={formData.custom_css}
              onChange={(e) => handleChange("custom_css", e.target.value)}
              placeholder=".my-class { color: red; }"
              className="font-mono text-sm min-h-[100px]"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="password">Password Protection</Label>
            <Input
              id="password"
              type="text"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Leave empty for public access"
            />
            <p className="text-xs text-muted-foreground">
              Visitors will need to enter this password to view the page
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
