import type { EditableProps } from "@kirana-ui/core/editable"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

/** `bind:value` is the text kept, `bind:editing` whether it is being edited. */
export type RootProps = PartAttributes<
  "div",
  StateFor<"editable", "root">,
  Controlled<EditableProps>
>

/**
 * Says the text, or the placeholder while there is none, unless it is given children. With
 * `child`, the snippet is also given that text as `text`.
 */
export type PreviewProps = PartAttributes<
  "span",
  StateFor<"editable", "preview">,
  unknown,
  HeldText
>

export type InputProps = PartAttributes<"input", StateFor<"editable", "input">>

export type EditTriggerProps = PartAttributes<"button", StateFor<"editable", "editTrigger">>

export type SubmitTriggerProps = PartAttributes<"button", StateFor<"editable", "submitTrigger">>

export type CancelTriggerProps = PartAttributes<"button", StateFor<"editable", "cancelTrigger">>
