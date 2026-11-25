import type { TimeFieldProps, TimeFieldSegment } from "@kirana-ui/core/time-field"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"timeField", "root">,
  Controlled<TimeFieldProps>
>

/** Draws nothing itself: its snippet once for each piece of the time, in the locale's order. */
export type SegmentsProps = { children: Snippet<[TimeFieldSegment]> }

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
export type SegmentProps = PartAttributes<
  "span",
  StateFor<"timeField", "segment">,
  {
    /** The piece, as `<TimeField.Segments>` gave it. */
    segment: TimeFieldSegment
  },
  HeldText
>

/** The field's hidden input: what a form submits, in 24 hours. */
export type InputProps = PartAttributes<"input", StateFor<"timeField", "input">>
