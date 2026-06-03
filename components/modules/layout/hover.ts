import type { MouseEvent } from "react";

/** Returns onMouseEnter/Leave handlers that apply the given inline styles on hover. */
export function hover(enter: Record<string, string>, leave: Record<string, string>) {
  return {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => Object.assign(e.currentTarget.style, enter),
    onMouseLeave: (e: MouseEvent<HTMLElement>) => Object.assign(e.currentTarget.style, leave),
  };
}
