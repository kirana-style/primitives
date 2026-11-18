import type { MeterProps } from "@kirana-ui/core/meter"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<"div", StateFor<"meter", "root">, Controlled<MeterProps>>

export type TrackProps = PartAttributes<"div", StateFor<"meter", "track">>

export type IndicatorProps = PartAttributes<"div", StateFor<"meter", "indicator">>

export type LabelProps = PartAttributes<"span", StateFor<"meter", "label">>

/** The written value, or what `children`, a snippet given the text, makes of it. */
export type ValueProps = PartAttributes<
  "span",
  StateFor<"meter", "value">,
  { children?: Snippet<[text: string | undefined]> | undefined },
  HeldText
>
