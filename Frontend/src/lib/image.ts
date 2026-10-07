/** Browser-side image helpers (no upload service needed). */
import { AppError } from "@/lib/errors"

async function decodeImage(
  file: Blob,
): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) return createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Decodes a picked photo; formats the browser can't read (e.g. iPhone HEIC) get a clear message. */
async function loadImage(
  file: Blob,
): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await decodeImage(file)
  } catch {
    throw new AppError(
      "This photo's format can't be read in the browser — choose a JPG, PNG or WebP photo",
    )
  }
}

/** Centre-crops to a square of `size` px and encodes it as a data URL. */
function squareDataUrl(
  img: CanvasImageSource & { width: number; height: number },
  size: number,
  type: string,
  quality: number,
): string {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new AppError("Canvas isn't available in this browser")
  const side = Math.min(img.width, img.height)
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
  return canvas.toDataURL(type, quality)
}

/** Browsers that can't encode WebP silently return PNG — fall back to JPEG then. */
function encodeSquare(
  img: CanvasImageSource & { width: number; height: number },
  size: number,
  quality: number,
): string {
  const webp = squareDataUrl(img, size, "image/webp", quality)
  return webp.startsWith("data:image/webp") ? webp : squareDataUrl(img, size, "image/jpeg", quality)
}

/**
 * A square avatar from a picked photo:
 * - `full`: 256 px, sharp, for this device
 * - `thumb`: the largest version that fits in `maxChars` characters (to store in a short text field)
 */
export async function makeAvatar(
  file: File,
  maxChars: number,
): Promise<{ full: string; thumb: string }> {
  const img = await loadImage(file)
  const full = encodeSquare(img, 256, 0.85)
  for (const size of [96, 80, 72, 64, 56, 48, 40, 32]) {
    for (const quality of [0.7, 0.5, 0.35, 0.2]) {
      const thumb = encodeSquare(img, size, quality)
      if (thumb.length <= maxChars) return { full, thumb }
    }
  }
  throw new AppError("This photo can't be made small enough — try a simpler one")
}
