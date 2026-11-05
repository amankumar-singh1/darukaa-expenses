"use client";

import { FileText, ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_ATTACHMENTS,
} from "@/lib/files";
import { formatFileSize } from "@/lib/money";
import type { AttachmentWithUrl } from "@/lib/types";
import { canPreviewInline } from "@/lib/files";
import { compressImage, isAcceptedFile, isPdf } from "@/lib/upload";
import { cn } from "@/lib/utils";

export type PendingFile = {
  id: string;
  file: File;
  previewUrl: string | null;
};

export function InvoiceUploader({
  pendingFiles,
  onPendingChange,
  existing,
  onRemoveExisting,
  disabled = false,
}: {
  pendingFiles: PendingFile[];
  onPendingChange: (files: PendingFile[]) => void;
  existing: AttachmentWithUrl[];
  onRemoveExisting: (id: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const total = existing.length + pendingFiles.length;
  const remaining = MAX_ATTACHMENTS - total;

  async function addFiles(list: FileList | File[]) {
    if (disabled) {
      return;
    }

    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    setProcessing(true);
    const next: PendingFile[] = [];

    for (const file of Array.from(list).slice(0, remaining)) {
      if (!isAcceptedFile(file)) {
        toast.error(`${file.name} is not a supported file type.`);
        continue;
      }

      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        continue;
      }

      const compressed = await compressImage(file);

      if (compressed.size > MAX_FILE_BYTES) {
        toast.error(
          `${file.name} is still larger than 10 MB after compression.`,
        );
        continue;
      }

      next.push({
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl: canPreviewInline(compressed.type)
          ? URL.createObjectURL(compressed)
          : null,
      });
    }

    if (next.length > 0) {
      onPendingChange([...pendingFiles, ...next]);
    }

    setProcessing(false);
  }

  function removePending(id: string) {
    const target = pendingFiles.find((item) => item.id === id);

    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }

    onPendingChange(pendingFiles.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setDragging(false);
          await addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border border-dashed px-4 py-6 text-center transition",
          dragging
            ? "border-brand-600 bg-brand-50"
            : "border-forest-900/20 bg-cream-50/60",
          disabled && "opacity-60",
        )}
      >
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
          <Plus className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-forest-900">
          Drop invoices here, or choose a file
        </p>
        <p className="mt-1 text-[11px] text-ink/45">
          PDF, JPG, PNG, WebP, HEIC · up to 10 MB each · {total}/
          {MAX_ATTACHMENTS} attached
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          onChange={async (event) => {
            if (event.target.files) {
              await addFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={async (event) => {
            if (event.target.files) {
              await addFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || processing || remaining <= 0}
            onClick={() => inputRef.current?.click()}
          >
            {processing ? "Preparing…" : "Choose files"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || processing || remaining <= 0}
            onClick={() => cameraRef.current?.click()}
            className="md:hidden"
          >
            Take photo
          </Button>
        </div>
      </div>

      {existing.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Saved invoices
          </p>
          <ul className="space-y-2">
            {existing.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-3 rounded-xl border border-forest-900/10 bg-white p-2.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream-100">
                  {isPdf({ mimeType: attachment.mime_type }) ? (
                    <FileText className="h-5 w-5 text-forest-900/60" />
                  ) : attachment.url ? (
                    <Image
                      src={attachment.url}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="h-11 w-11 object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-ink/30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-forest-900">
                    {attachment.file_name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink/40">
                    {formatFileSize(attachment.size_bytes)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveExisting(attachment.id)}
                  disabled={disabled}
                  aria-label={`Remove ${attachment.file_name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink/35 transition hover:bg-danger-50 hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pendingFiles.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Ready to upload
          </p>
          <ul className="space-y-2">
            {pendingFiles.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-brand-600/20 bg-brand-50/40 p-2.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="h-11 w-11 object-cover"
                    />
                  ) : (
                    <FileText className="h-5 w-5 text-forest-900/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-forest-900">
                    {item.file.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink/40">
                    {formatFileSize(item.file.size)} · uploads when you save
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removePending(item.id)}
                  disabled={disabled}
                  aria-label={`Remove ${item.file.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink/35 transition hover:bg-danger-50 hover:text-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
