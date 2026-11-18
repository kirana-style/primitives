import type { ToolbarProps } from "@kirana-ui/core/toolbar"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"toolbar", "root">, Controlled<ToolbarProps>>

export type ButtonProps = PartAttributes<
  "button",
  StateFor<"toolbar", "button">,
  { disabled?: boolean | undefined }
>

export type LinkProps = PartAttributes<"a", StateFor<"toolbar", "link">>

export type InputProps = PartAttributes<
  "input",
  StateFor<"toolbar", "input">,
  { disabled?: boolean | undefined }
>

export type GroupProps = PartAttributes<
  "div",
  StateFor<"toolbar", "group">,
  { disabled?: boolean | undefined }
>

export type SeparatorProps = PartAttributes<"div", StateFor<"toolbar", "separator">>
