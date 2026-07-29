/**
 * Serialize any JSON-serializable chart payload for download / clipboard.
 */
export function toPrettyJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/**
 * Browser helper: trigger a file download. No-op-safe when document is missing.
 */
export function downloadTextFile(
  filename: string,
  contents: string,
  mime = "application/json",
): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
  downloadTextFile(filename, toPrettyJson(data), "application/json");
}
