/**
 * Resizes and re-compresses an image file entirely in the browser (Canvas
 * API, no server/library needed) before it's uploaded. Previously, staff
 * picking a photo straight off a phone camera (often 4-12MB, 4000px+ wide)
 * would have that exact file uploaded and served as-is to every visitor --
 * this is the single biggest lever on page load speed for a site that's
 * mostly photos. Resizing to a sane max dimension and re-encoding as JPEG
 * at a reasonable quality typically cuts file size by 80-95% with no
 * visible quality loss at the sizes these images are actually displayed.
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

    // Already smaller than the target and already a compressed format -- no point re-encoding.
    if (scale === 1 && file.size < 400 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
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

    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;

    // Only use the compressed version if it's actually smaller -- guards
    // against the rare case where re-encoding a tiny/simple image bloats it.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('compressImage failed, uploading original file:', err);
    return file;
  }
}
