import type { ResizablePanelOptions, ResizableProps } from "@kirana-ui/core/resizable"

import type { Controlled, PartAttributes, StateFor } from "../types.ts"

export type GroupProps = PartAttributes<
  "div",
  StateFor<"resizable", "group">,
  Controlled<ResizableProps>
>

export type PanelProps = PartAttributes<
  "div",
  StateFor<"resizable", "panel">,
  ResizablePanelOptions
>

export type HandleProps = PartAttributes<
  "div",
  StateFor<"resizable", "handle">,
  { disabled?: boolean | undefined }
>
