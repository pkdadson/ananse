import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";

export type AnanseHeight = number | string;

/** Resolve height prop to a CSS value. */
export function resolveHeight(height?: AnanseHeight): string | undefined {
  if (height === undefined) return undefined;
  return typeof height === "number" ? `${height}px` : height;
}

/**
 * Dev-only: warn once if the chart container has zero height
 * (the #1 cause of "blank chart" reports).
 * Pass skip=true when a height prop is set, or under Vitest/jsdom.
 */
export function useZeroHeightWarning(
  ref: RefObject<HTMLElement | null>,
  label = "Ananse",
  skip = false,
): void {
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || skip) return;
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      ?.env;
    if (env?.NODE_ENV === "production") return;
    if (env?.VITEST) return;
    const el = ref.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    if (h < 32) {
      warned.current = true;
      console.warn(
        `[${label}] container height is ${Math.round(h)}px — the chart will look blank. Pass height="100vh" or give the parent a real height (flex:1 + minHeight:0).`,
      );
    }
  }, [ref, label, skip]);
}

/**
 * Track container width via ResizeObserver. Returns null until first measure.
 * Used to make fit-view and layout decisions responsive without relying on
 * window.matchMedia (works when the chart is embedded in a smaller region).
 */
export function useContainerWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

export const DEFAULT_CHART_MIN_HEIGHT = 480;

export function chartShellStyle(height?: AnanseHeight, style?: CSSProperties): CSSProperties {
  const resolved = resolveHeight(height);
  return {
    width: "100%",
    height: resolved ?? "100%",
    minHeight: resolved ? undefined : DEFAULT_CHART_MIN_HEIGHT,
    ...style,
  };
}
