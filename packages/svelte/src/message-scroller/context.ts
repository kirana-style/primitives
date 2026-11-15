import type { MessageScroller } from "@kirana-ui/core/message-scroller"
import { getContext, setContext } from "svelte"

const KEY = Symbol("MessageScroller")

export const provide = (controller: MessageScroller): MessageScroller => setContext(KEY, controller)

export function useScroller(): MessageScroller {
  const controller = getContext<MessageScroller | undefined>(KEY)
  if (!controller) throw new Error("A MessageScroller part must be inside <MessageScroller.Root>")
  return controller
}
