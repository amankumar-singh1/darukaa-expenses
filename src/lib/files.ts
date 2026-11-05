export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;

export const ACCEPTED_FILE_TYPES =
  "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";

export const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const ALLOWED_MIME_TYPES = new Set(Object.keys(EXTENSION_BY_MIME));

export const INLINE_PREVIEW_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function canPreviewInline(mimeType: string) {
  return INLINE_PREVIEW_MIME_TYPES.has(mimeType);
}

export function fileTypeLabel(mimeType: string) {
  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (mimeType === "image/heic") {
    return "HEIC";
  }

  if (mimeType === "image/heif") {
    return "HEIF";
  }

  return mimeType.split("/")[1]?.toUpperCase() ?? "FILE";
}

export function resolveMimeType(file: { name: string; type: string }) {
  if (file.type) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "";
}
