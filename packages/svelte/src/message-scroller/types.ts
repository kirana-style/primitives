import type { MessageScrollerProps } from "@kirana-ui/core/message-scroller"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"messageScroller", "root">,
  Controlled<MessageScrollerProps>
>

export type ViewportProps = PartAttributes<"div", StateFor<"messageScroller", "viewport">>

export type ContentProps = PartAttributes<"div", StateFor<"messageScroller", "content">>

export type ButtonProps = PartAttributes<"button", StateFor<"messageScroller", "button">>
