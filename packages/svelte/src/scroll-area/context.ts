import type { ScrollArea, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { getContext, setContext } from "svelte"

const KEY = Symbol("ScrollArea")
const SCROLLBAR = Symbol("ScrollAreaScrollbar")

export const provide = (controller: ScrollArea): ScrollArea => setContext(KEY, controller)

export function useScrollArea(): ScrollArea {
  const controller = getContext<ScrollArea | undefined>(KEY)
  if (!controller) throw new Error("A ScrollArea part must be inside <ScrollArea.Root>")
  return controller
}

export const provideScrollbar = (bar: ScrollAreaScrollbar): ScrollAreaScrollbar =>
  setContext(SCROLLBAR, bar)

export function useScrollbar(): ScrollAreaScrollbar {
  const bar = getContext<ScrollAreaScrollbar | undefined>(SCROLLBAR)
  if (!bar) throw new Error("A ScrollArea.Thumb must be inside <ScrollArea.Scrollbar>")
  return bar
}
