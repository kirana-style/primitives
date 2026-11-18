import type { ProgressProps } from "@kirana-ui/core/progress"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"progress", "root">,
  Controlled<ProgressProps>
>

export type TrackProps = PartAttributes<"div", StateFor<"progress", "track">>

export type IndicatorProps = PartAttributes<"div", StateFor<"progress", "indicator">>

export type LabelProps = PartAttributes<"span", StateFor<"progress", "label">>

/** The written value, or what `children`, a snippet given the text, makes of it. */
export type ValueProps = PartAttributes<
  "span",
  StateFor<"progress", "value">,
  { children?: Snippet<[text: string | undefined]> | undefined },
  HeldText
>
