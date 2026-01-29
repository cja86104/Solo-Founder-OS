'use client';

import { type Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EditorToolbarProps {
  editor: Editor | null;
  variant?: 'full' | 'simple';
  characterCount?: number;
  maxLength?: number;
  onImageUpload?: () => void;
}

export function EditorToolbar({
  editor,
  variant = 'full',
  characterCount,
  maxLength,
  onImageUpload,
}: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    setLinkUrl('');
    setLinkOpen(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b p-1">
      {/* Undo/Redo */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Basic formatting */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Toggle size="sm" pressed={editor.isActive('link')}>
            <Link className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setLink();
                }
              }}
            />
            <Button size="sm" onClick={setLink}>
              Set
            </Button>
            {editor.isActive('link') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkOpen(false);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Full variant extras */}
      {variant === 'full' && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings */}
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Lists */}
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>

          {/* Block elements */}
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('codeBlock')}
            onPressedChange={() =>
              editor.chain().focus().toggleCodeBlock().run()
            }
          >
            <Code className="h-4 w-4" />
          </Toggle>

          {/* Image upload */}
          {onImageUpload && (
            <>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={onImageUpload}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </>
      )}

      {/* Character count */}
      {maxLength !== undefined && characterCount !== undefined && (
        <div className="ml-auto text-xs text-muted-foreground px-2">
          <span
            className={
              characterCount > maxLength ? 'text-destructive font-medium' : ''
            }
          >
            {characterCount}
          </span>
          /{maxLength}
        </div>
      )}
    </div>
  );
}
