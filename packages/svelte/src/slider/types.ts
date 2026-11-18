import type { SliderProps, SliderValue } from "@kirana-ui/core/slider"
import type { Snippet } from "svelte"

import type { Controlled, HeldInput, HeldText, PartAttributes, StateFor } from "../types.ts"

/**
 * `Value` is what the slider is given, `value` or `defaultValue`: a number for one thumb, a
 * list for a range. What `onValueChange` and `onValueCommitted` are told is the same kind.
 */
export type RootProps<Value extends SliderValue = SliderValue> = PartAttributes<
  "div",
  StateFor<"slider", "root">,
  Controlled<SliderProps<Value>>
>

/** The written value, or what `children`, a snippet given the text and the values, makes of it. */
export type ValueProps = PartAttributes<
  "output",
  StateFor<"slider", "value">,
  { children?: Snippet<[text: string, values: readonly number[]]> | undefined },
  HeldText
>

export type ControlProps = PartAttributes<"div", StateFor<"slider", "control">>

export type TrackProps = PartAttributes<"div", StateFor<"slider", "track">>

export type IndicatorProps = PartAttributes<"div", StateFor<"slider", "indicator">>

/** A thumb. With `child`, the snippet is also given `input`, the thumb's native range input. */
export type ThumbProps = PartAttributes<
  "div",
  StateFor<"slider", "thumb">,
  {
    /**
     * Which value of a range the thumb is, from 0. A thumb that is given none takes its place
     * among the slider's thumbs, in the order they are written.
     */
    index?: number | undefined
  },
  HeldInput
>
