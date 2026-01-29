'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import UnderlineExtension from '@tiptap/extension-underline';
import { EditorToolbar } from './editor-toolbar';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  variant?: 'full' | 'simple';
  className?: string;
  onImageUpload?: () => void;
  editorClassName?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  maxLength,
  variant = 'full',
  className,
  onImageUpload,
  editorClassName,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: variant === 'full' ? { levels: [1, 2, 3] } : false,
        bulletList: variant === 'full' ? {} : false,
        orderedList: variant === 'full' ? {} : false,
        blockquote: variant === 'full' ? {} : false,
        codeBlock: variant === 'full' ? {} : false,
        code: variant === 'full' ? {} : false,
        horizontalRule: variant === 'full' ? {} : false,
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      ...(variant === 'full'
        ? [
            ImageExtension.configure({
              HTMLAttributes: {
                class: 'rounded-lg max-w-full',
              },
            }),
          ]
        : []),
      Placeholder.configure({
        placeholder,
      }),
      ...(maxLength
        ? [CharacterCount.configure({ limit: maxLength })]
        : [CharacterCount]),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          variant === 'simple' ? 'min-h-[120px]' : 'min-h-[300px]',
          editorClassName
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const characterCount = editor?.storage.characterCount?.characters() ?? 0;

  return (
    <div
      className={cn(
        'rounded-md border bg-background',
        className
      )}
    >
      <EditorToolbar
        editor={editor}
        variant={variant}
        characterCount={characterCount}
        maxLength={maxLength}
        onImageUpload={onImageUpload}
      />
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
