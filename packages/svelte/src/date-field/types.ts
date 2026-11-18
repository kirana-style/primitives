import type { DateFieldProps, DateFieldSegment } from "@kirana-ui/core/date-field"
import type { Snippet } from "svelte"

import type { Controlled, HeldText, PartAttributes, StateFor } from "../types.ts"

export type RootProps = PartAttributes<
  "div",
  StateFor<"dateField", "root">,
  Controlled<DateFieldProps>
>

/** Draws nothing itself: its snippet once for each piece of the date, in the locale's order. */
export type SegmentsProps = { children: Snippet<[DateFieldSegment]> }

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
export type SegmentProps = PartAttributes<
  "span",
  StateFor<"dateField", "segment">,
  {
    /** The piece, as `<DateField.Segments>` gave it. */
    segment: DateFieldSegment
  },
  HeldText
>

/** The field's hidden input: what a form submits. */
export type InputProps = PartAttributes<"input", StateFor<"dateField", "input">>
