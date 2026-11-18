import type { DialogProps } from "@kirana-ui/core/dialog"
import type { Snippet } from "svelte"

import type { PartAttributes, Renderless, StateFor } from "../types.ts"

/** It draws nothing: `bind:open` is whether the dialog shows. */
export type RootProps = Renderless<DialogProps>

export type TriggerProps = PartAttributes<"button", StateFor<"dialog", "trigger">>

/** Draws nothing itself: its content at the end of `<body>`, or where a `<PortalProvider>` says. */
export type PortalProps = { children?: Snippet | undefined }

export type BackdropProps = PartAttributes<"div", StateFor<"dialog", "backdrop">>

export type ViewportProps = PartAttributes<"div", StateFor<"dialog", "viewport">>

export type PopupProps = PartAttributes<"div", StateFor<"dialog", "popup">>

export type TitleProps = PartAttributes<"h2", StateFor<"dialog", "title">>

export type DescriptionProps = PartAttributes<"p", StateFor<"dialog", "description">>

export type CloseProps = PartAttributes<"button", StateFor<"dialog", "close">>
