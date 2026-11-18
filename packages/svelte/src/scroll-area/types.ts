import type { Orientation } from "@kirana-ui/core"

import type { PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"scrollArea", "root">>

export type ViewportProps = PartAttributes<"div", StateFor<"scrollArea", "viewport">>

export type ContentProps = PartAttributes<"div", StateFor<"scrollArea", "content">>

export type ScrollbarProps = PartAttributes<
  "div",
  StateFor<"scrollArea", "scrollbar">,
  {
    /** Which way it scrolls. Default `vertical`. */
    orientation?: Orientation | undefined
    /** Keeps the bar in the page while there is nothing to scroll its way. */
    keepMounted?: boolean | undefined
  }
>

export type ThumbProps = PartAttributes<"div", StateFor<"scrollArea", "thumb">>

export type CornerProps = PartAttributes<"div", StateFor<"scrollArea", "corner">>
