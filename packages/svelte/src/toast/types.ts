import type { ToastProps, ToastRecord } from "@kirana-ui/core/toast"
import type { Snippet } from "svelte"

import type { ToastContent } from "./context.ts"
import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

/** Where a toaster's toasts are drawn. Always in the page: put it once, near the root. */
export type ViewportProps = PartAttributes<
  "div",
  StateFor<"toast", "viewport">,
  Controlled<ToastProps<ToastContent>>
>

/** Draws nothing itself: its snippet once for each toast, the newest first. */
export type ListProps = { children: Snippet<[ToastRecord<ToastContent>]> }

export type RootProps = PartAttributes<
  "div",
  StateFor<"toast", "root">,
  {
    /** The toast, as `<Toast.List>` gave it. */
    toast: ToastRecord<ToastContent>
  }
>

export type ContentProps = PartAttributes<"div", StateFor<"toast", "content">>

/** The toast's title, unless it is given content of its own. */
export type TitleProps = PartAttributes<"div", StateFor<"toast", "title">, unknown, HeldText>

/** The toast's description, unless it is given content of its own. */
export type DescriptionProps = PartAttributes<
  "div",
  StateFor<"toast", "description">,
  unknown,
  HeldText
>

export type CloseProps = PartAttributes<"button", StateFor<"toast", "close">>

/**
 * The toast's action, its label unless it is given content of its own. A press tells the
 * action (`onAction`), then closes the toast unless the action called `details.cancel()`.
 */
export type ActionProps = PartAttributes<"button", StateFor<"toast", "action">, unknown, HeldText>
