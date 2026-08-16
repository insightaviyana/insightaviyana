/**
 * Resizes and re-compresses an image file entirely in the browser (Canvas
 * API, no server/library needed) before it's uploaded. Previously, staff
 * picking a photo straight off a phone camera (often 4-12MB, 4000px+ wide)
 * would have that exact file uploaded and served as-is to every visitor --
 * this is the single biggest lever on page load speed for a site that's
 * mostly photos. Resizing to a sane max dimension and re-encoding typically
 * cuts file size by 80-95% with no visible quality loss at the sizes these
 * images are actually displayed.
 *
 * Encodes as WebP where the browser supports it (every browser this app
 * needs to support does -- Safari has shipped WebP encoding since 14),
 * falling back to JPEG otherwise. WebP typically produces 25-35% smaller
 * files than JPEG at equivalent visual quality -- ENGINEERING_ASSESSMENT.md
 * "No image optimization pipeline" -- this is the format-level half of that;
 * the resize-on-upload behavior below was already in place.
 *
 * Falls back to returning the original file untouched if anything goes
 * wrong (corrupt image, unsupported format, canvas failure) -- a failed
 * compression should never block the upload itself.
 */
export async function compressImage(file: File, maxDimension = 1920, quality = 0.82): Promise<File> {
  // Only compress actual raster images; SVGs and anything else pass through untouched.
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    // Already smaller than the target and already a compressed, modern
    // format -- no point re-encoding.
    if (scale === 1 && file.size < 400 * 1024 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
      bitmap.close();
      return file;
    }

    const targetWidth = Math.round(bitmap.width * scale);
    const targetHeight = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return file; }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const encoded = await encodeSmallestSupported(canvas, quality);
    if (!encoded) return file;

    // Only use the compressed version if it's actually smaller -- guards
    // against the rare case where re-encoding a tiny/simple image bloats it.
    if (encoded.blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + encoded.extension;
    return new File([encoded.blob], newName, { type: encoded.mimeType });
  } catch (err) {
    console.error('compressImage failed, uploading original file:', err);
    return file;
  }
}

let webpSupportCache: boolean | null = null;

/** Cached, one-time check: does this browser's canvas actually encode WebP (not just decode it)? */
function canvasSupportsWebpEncoding(): boolean {
  if (webpSupportCache !== null) return webpSupportCache;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    // toDataURL falls back to image/png silently if the requested type
    // isn't supported for encoding -- checking the returned prefix is the
    // standard feature-detection trick for this.
    webpSupportCache = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupportCache = false;
  }
  return webpSupportCache;
}

async function encodeSmallestSupported(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<{ blob: Blob; mimeType: string; extension: string } | null> {
  const mimeType = canvasSupportsWebpEncoding() ? 'image/webp' : 'image/jpeg';
  const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
  const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
  return blob ? { blob, mimeType, extension } : null;
}
