// Converts a File/Blob to a base64 data URL — shared by every intake path
// that sends images as base64-in-JSON (QuickReport's photo/document capture,
// EventDetail's completion-evidence upload) rather than multipart.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Photos are sent as base64 inside JSON, and the hosted API rejects request
// bodies over ~4.5MB — a single modern phone photo is often bigger than
// that. Downscale to at most `maxDimension` px on the long edge and
// re-encode as JPEG, which keeps evidence photos sharp at a few hundred KB.
// Anything the browser can't decode (e.g. HEIC on some browsers) or that
// isn't an image is passed through unchanged.
export async function imageFileToDataUrl(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return fileToDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    // JPEG has no transparency; paint white behind transparent PNGs.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    // Keep the original if it was already small and re-encoding didn't help.
    return compressed.length < file.size * 1.37 ? compressed : fileToDataUrl(file);
  } catch {
    return fileToDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
