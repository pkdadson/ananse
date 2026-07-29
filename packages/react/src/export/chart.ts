import { downloadJson, toPrettyJson } from "@canvas/core";

/** Download chart data as JSON (org / mind / flow payloads). */
export function exportChartJson(filename: string, data: unknown): void {
  downloadJson(filename, data);
}

/** Copy JSON to clipboard when available. */
export async function copyChartJson(data: unknown): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(toPrettyJson(data));
  return true;
}

/**
 * Export a DOM element (e.g. the React Flow wrapper) as PNG via SVG foreignObject.
 * Works without extra dependencies for modern browsers.
 */
export async function exportElementPng(
  element: HTMLElement,
  filename = "canvas-chart.png",
): Promise<void> {
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.background = getComputedStyle(element).backgroundColor || "#fff";

  const serializer = new XMLSerializer();
  const xhtml = serializer.serializeToString(clone);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">${xhtml}</div>
  </foreignObject>
</svg>`;

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to rasterize chart"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
