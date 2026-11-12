import { createHoverPopup } from "./hover-popup.ts"
import type { HoverPopup, HoverPopupProps } from "./hover-popup.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export type { HoverPopup, HoverPopupProps } from "./hover-popup.ts"

/** `delay` defaults to 600 milliseconds, `closeDelay` to 300. */
export type HoverCardProps = HoverPopupProps
export type HoverCard = HoverPopup

/** A preview of where a link goes, shown while the pointer rests on it. It can hold anything. */
export const createHoverCard = (props: ReadonlySignal<HoverCardProps>): HoverCard =>
  createHoverPopup(props, { name: "hover-card", delay: 600, closeDelay: 300, describes: false })
