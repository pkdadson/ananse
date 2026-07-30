import { type CSSProperties, type RefObject, useEffect, useRef } from "react";

export type CanvasHeight = number | string;

/** Resolve height prop to a CSS value. */
export function resolveHeight(height?: CanvasHeight): string | undefined {
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
  label = "Canvas",
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

export const DEFAULT_CHART_MIN_HEIGHT = 480;

export function chartShellStyle(height?: CanvasHeight, style?: CSSProperties): CSSProperties {
  const resolved = resolveHeight(height);
  return {
    width: "100%",
    height: resolved ?? "100%",
    minHeight: resolved ? undefined : DEFAULT_CHART_MIN_HEIGHT,
    ...style,
  };
}
