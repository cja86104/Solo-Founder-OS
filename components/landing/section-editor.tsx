"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  ChevronRight,
} from "lucide-react";
import { SECTION_TEMPLATES, type PageSection } from "@/types/landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SectionEditorProps {
  section: PageSection;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (props: Record<string, unknown>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SectionEditor({
  section,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const template = SECTION_TEMPLATES[section.type as keyof typeof SECTION_TEMPLATES];

  const renderFieldEditor = (key: string, value: unknown) => {
    if (typeof value === "string") {
      if (key.toLowerCase().includes("description") || key.toLowerCase().includes("content")) {
        return (
          <Textarea
            value={value}
            onChange={(e) => onUpdate({ [key]: e.target.value })}
            className="min-h-[80px]"
          />
        );
      }
      return (
        <Input
          value={value}
          onChange={(e) => onUpdate({ [key]: e.target.value })}
        />
      );
    }

    if (typeof value === "boolean") {
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onUpdate({ [key]: e.target.checked })}
          className="h-4 w-4"
        />
      );
    }

    if (typeof value === "number") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onUpdate({ [key]: parseInt(e.target.value) })}
        />
      );
    }

    // For arrays and objects, show as JSON (simplified for demo)
    if (Array.isArray(value) || typeof value === "object") {
      return (
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onUpdate({ [key]: JSON.parse(e.target.value) });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className="font-mono text-xs min-h-[100px]"
        />
      );
    }

    return null;
  };

  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ");
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
              <span className="font-medium">{template?.name || section.type}</span>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onMoveUp}
                disabled={isFirst}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onMoveDown}
                disabled={isLast}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete section?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the {template?.name || section.type} section from your page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {Object.entries(section.props).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label>{formatFieldName(key)}</Label>
                {renderFieldEditor(key, value)}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
