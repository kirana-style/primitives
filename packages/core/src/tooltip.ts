import { createHoverPopup } from "./hover-popup.ts"
import type { HoverPopup, HoverPopupProps } from "./hover-popup.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type { HoverPopup, HoverPopupProps } from "./hover-popup.ts"

/** `delay` defaults to 600 milliseconds, `closeDelay` to 0. */
export type TooltipProps = HoverPopupProps
export type Tooltip = HoverPopup

/** A short description of its trigger, shown while the pointer rests on it or it has focus. */
export const createTooltip = (props: ReadonlySignal<TooltipProps>): Tooltip =>
  createHoverPopup(props, { name: "tooltip", delay: 600, closeDelay: 0, describes: true })
