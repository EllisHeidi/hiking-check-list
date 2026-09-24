/**
 * Downscale a photo in the browser before upload (phone photos are often 5–12 MB).
 * Keeps the original if it's already small or the browser can't decode it.
 */
export async function downscaleImage(file: File, maxEdge = 2400, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !("createImageBitmap" in window)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function extensionFor(type: string) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}
