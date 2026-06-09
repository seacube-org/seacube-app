/** Trigger a browser "save as" download for an in-memory Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revocation: some browsers resolve the href after the click handler
  // returns, so revoking in the same tick can abort the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
