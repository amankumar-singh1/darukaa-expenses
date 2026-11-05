"use client";

import {
  ALLOWED_MIME_TYPES,
  EXTENSION_BY_MIME,
  MAX_FILE_BYTES,
  resolveMimeType,
} from "@/lib/files";
import { createClient } from "@/lib/supabase/client";
import type { AttachmentInput } from "@/lib/types";

export function isAcceptedFile(file: File) {
  return ALLOWED_MIME_TYPES.has(resolveMimeType(file));
}

export function isPdf(file: { mimeType: string }) {
  return file.mimeType === "application/pdf";
}

function extensionForMime(mimeType: string) {
  return EXTENSION_BY_MIME[mimeType] ?? "bin";
}

export async function compressImage(file: File) {
  const mimeType = resolveMimeType(file);

  if (
    !mimeType.startsWith("image/") ||
    mimeType === "image/heic" ||
    mimeType === "image/heif"
  ) {
    return file;
  }

  if (file.size < 1.2 * 1024 * 1024) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return file;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "receipt";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function uploadReceipt(
  file: File,
  expenseId: string,
): Promise<AttachmentInput> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const mimeType = resolveMimeType(file);
  const extension = extensionForMime(mimeType);
  const path = `${user.id}/${expenseId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("receipts").upload(path, file, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    storagePath: path,
    fileName: file.name.slice(0, 255),
    mimeType,
    sizeBytes: file.size,
  };
}

export async function removeReceipts(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  try {
    const supabase = createClient();
    await supabase.storage.from("receipts").remove(paths);
  } catch {
    // Best-effort cleanup. Orphaned files can be removed later.
  }
}

export { MAX_FILE_BYTES };
