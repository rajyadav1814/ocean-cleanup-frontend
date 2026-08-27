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
