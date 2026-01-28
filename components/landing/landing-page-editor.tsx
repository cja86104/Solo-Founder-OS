"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Loader2,
  Globe,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { LandingPage, PageContent, PageSection } from "@/types/landing";
import { SECTION_TEMPLATES } from "@/types/landing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionEditor } from "@/components/landing/section-editor";
import { PageSettingsPanel } from "@/components/landing/page-settings-panel";

interface LandingPageEditorProps {
  page: LandingPage;
}

export function LandingPageEditor({ page: initialPage }: LandingPageEditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [page, setPage] = useState(initialPage);
  const [content, setContent] = useState<PageContent>(
    initialPage.content as PageContent || { sections: [] }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("sections");

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await (supabase
        .from("landing_pages") as any)
        .update({ content })
        .eq("id", page.id);

      if (error) throw error;

      toast.success("Changes saved");
    } catch (error) {
      toast.error("Failed to save changes");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const newStatus = page.status === "published" ? "draft" : "published";
      const updates: Partial<LandingPage> = {
        status: newStatus,
        content,
      };

      if (newStatus === "published" && !page.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await (supabase
        .from("landing_pages") as any)
        .update(updates)
        .eq("id", page.id);

      if (error) throw error;

      setPage({ ...page, status: newStatus });
      toast.success(
        newStatus === "published"
          ? "Page published!"
          : "Page unpublished"
      );
    } catch (error) {
      toast.error("Failed to update page status");
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const addSection = (type: keyof typeof SECTION_TEMPLATES) => {
    const template = SECTION_TEMPLATES[type];
    const newSection: PageSection = {
      id: `${type}-${Date.now()}`,
      type,
      order: content.sections.length,
      props: { ...template.defaultProps },
    };

    setContent({
      ...content,
      sections: [...content.sections, newSection],
    });
  };

  const updateSection = (sectionId: string, props: Record<string, unknown>) => {
    setContent({
      ...content,
      sections: content.sections.map((s) =>
        s.id === sectionId ? { ...s, props: { ...s.props, ...props } } : s
      ),
    });
  };

  const deleteSection = (sectionId: string) => {
    setContent({
      ...content,
      sections: content.sections.filter((s) => s.id !== sectionId),
    });
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    const sections = [...content.sections];
    const index = sections.findIndex((s) => s.id === sectionId);

    if (direction === "up" && index > 0) {
      [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
    } else if (direction === "down" && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    }

    // Update order numbers
    sections.forEach((s, i) => {
      s.order = i;
    });

    setContent({ ...content, sections });
  };

  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${page.slug}`;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href="/landing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold">{page.title}</h1>
              <p className="text-xs text-muted-foreground">/{page.slug}</p>
            </div>
            <Badge
              variant="outline"
              className={
                page.status === "published"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }
            >
              {page.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {page.status === "published" && (
              <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Live
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              {page.status === "published" ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="container py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-6">
            {/* Add Section Button */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Page Sections
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Section
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {Object.entries(SECTION_TEMPLATES).map(([type, template]) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => addSection(type as keyof typeof SECTION_TEMPLATES)}
                        >
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.sections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No sections yet. Add your first section to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <SectionEditor
                          key={section.id}
                          section={section}
                          isFirst={index === 0}
                          isLast={index === content.sections.length - 1}
                          onUpdate={(props) => updateSection(section.id, props)}
                          onDelete={() => deleteSection(section.id)}
                          onMoveUp={() => moveSection(section.id, "up")}
                          onMoveDown={() => moveSection(section.id, "down")}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <PageSettingsPanel
              page={page}
              onUpdate={(updates) => {
                setPage({ ...page, ...updates });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
