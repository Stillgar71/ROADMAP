"use client";

import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const buttonClass =
  "h-8 min-w-8 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";

async function uploadImage(image: File) {
  const formData = new FormData();
  formData.append("image", image);

  const response = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Image upload failed.");
  return data.url as string;
}

export function RichTextEditor({
  label,
  value,
  onChange,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      FontSize,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: false }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "rich-text-content min-h-40 resize-y overflow-auto px-3 py-2 text-sm leading-6 text-slate-800 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value)
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  const insertUploadedImage = useCallback(async (image: File) => {
    if (!editor) return;
    setUploadMessage("Uploading image...");
    try {
      const url = await uploadImage(image);
      editor.chain().focus().setImage({ src: url, alt: image.name }).run();
      setUploadMessage(null);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Image upload failed.");
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.files ?? []).find((file) =>
        file.type.startsWith("image/"),
      );
      if (!image) return;
      event.preventDefault();
      void insertUploadedImage(image);
    };

    editor.view.dom.addEventListener("paste", handlePaste);
    return () => editor.view.dom.removeEventListener("paste", handlePaste);
  }, [editor, insertUploadedImage]);

  const addLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
          <select
            aria-label="Font family"
            disabled={!editor}
            defaultValue=""
            onChange={(event) =>
              editor?.chain().focus().setFontFamily(event.target.value).run()
            }
            className="h-8 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700"
          >
            <option value="">Font</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
          <select
            aria-label="Font size"
            disabled={!editor}
            defaultValue=""
            onChange={(event) =>
              editor?.chain().focus().setFontSize(event.target.value).run()
            }
            className="h-8 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700"
          >
            <option value="">Size</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="24px">24</option>
          </select>
          <button
            type="button"
            aria-label="Bold"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={buttonClass}
          >
            B
          </button>
          <button
            type="button"
            aria-label="Italic"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`${buttonClass} italic`}
          >
            I
          </button>
          <button
            type="button"
            aria-label="Underline"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`${buttonClass} underline`}
          >
            U
          </button>
          <button
            type="button"
            aria-label="Heading 2"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={buttonClass}
          >
            H2
          </button>
          <button
            type="button"
            aria-label="Bullet list"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={buttonClass}
          >
            List
          </button>
          <button
            type="button"
            aria-label="Numbered list"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={buttonClass}
          >
            1.
          </button>
          <button type="button" aria-label="Add link" disabled={!editor} onClick={addLink} className={buttonClass}>Link</button>
          <button type="button" aria-label="Align left" disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("left").run()} className={buttonClass}>Left</button>
          <button type="button" aria-label="Align center" disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("center").run()} className={buttonClass}>Center</button>
          <button type="button" aria-label="Undo" disabled={!editor} onClick={() => editor?.chain().focus().undo().run()} className={buttonClass}>Undo</button>
          <button type="button" aria-label="Redo" disabled={!editor} onClick={() => editor?.chain().focus().redo().run()} className={buttonClass}>Redo</button>
          <button type="button" aria-label="Upload image" disabled={!editor} onClick={() => imageInputRef.current?.click()} className={buttonClass}>Image</button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(event) => {
              const image = event.target.files?.[0];
              if (image) void insertUploadedImage(image);
              event.target.value = "";
            }}
          />
        </div>
        <EditorContent editor={editor} />
        {uploadMessage && (
          <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-600" role="status">
            {uploadMessage}
          </p>
        )}
      </div>
    </div>
  );
}
