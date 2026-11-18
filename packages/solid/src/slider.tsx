import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type {
  Slider as Controller,
  SliderChangeDetails,
  SliderProps,
  SliderTold,
  SliderValue,
} from "@kirana-ui/core/slider"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["slider"]

const Context = createContext<Controller>()

function useSlider(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Slider part must be inside <Slider.Root>")
  return made
}

/**
 * `Value` is what the slider is given, `value` or `defaultValue`: a number for one thumb, a
 * list for a range. What `onValueChange` and `onValueCommitted` are told is the same kind.
 */
export type RootProps<Value extends SliderValue = SliderValue> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<SliderProps<Value>, "id"> & { id?: string }
>

// Given neither `value` nor `defaultValue`, a slider has one thumb: its value is a number.
function Root<Value extends SliderValue = number>(props: RootProps<Value>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "onValueCommitted",
    "min",
    "max",
    "step",
    "largeStep",
    "minStepsBetweenValues",
    "thumbAlignment",
    "orientation",
    "disabled",
    "name",
    "form",
    "format",
    "locale",
    "getAriaValueText",
    "id",
  ])
  const generated = createUniqueId()
  const field = useContext(FieldContext)
  const made = controller(
    within(createSlider<Value>, { field, direction: useContext(DirectionContext) }),
    () => ({
      ...local,
      id: local.id ?? generated,
      onValueChange: (value: SliderTold<Value>, details: SliderChangeDetails) =>
        local.onValueChange?.(value, details),
      onValueCommitted: (value: SliderTold<Value>, details: SliderChangeDetails) =>
        local.onValueCommitted?.(value, details),
    })
  )
  return (
    <Context.Provider value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ThumbProps = PartComponentProps<"div", StateOf<Parts["thumb"]>, { index?: number }>

/** `index` is which value of a range the thumb is, from 0. */
function Thumb(props: ThumbProps): JSX.Element {
  const [local, rest] = splitProps(props, ["index", "children"])
  // A thumb is its index for as long as it is in the page. Given none, it takes its place
  // among the slider's thumbs, in the order they are written.
  const generated = createUniqueId()
  const index = untrack(() => local.index ?? generated)
  const slider = useSlider()
  return (
    <Part of={slider.thumb(index)} tag="div" {...rest}>
      {local.children}
      <Part of={slider.thumbInput(index)} tag="input" />
    </Part>
  )
}

export type ValueProps = PartComponentProps<
  "output",
  StateOf<Parts["value"]>,
  { children?: (text: () => string, values: () => readonly number[]) => JSX.Element }
>

/** The written value, or what its child, a function, makes of it and of the values. */
function Value(props: ValueProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children"])
  const made = useSlider()
  const text = fromSignal(made.text)
  const values = fromSignal(made.values)
  return (
    <Part of={made.value} tag="output" {...rest}>
      {local.children ? local.children(text, values) : text()}
    </Part>
  )
}

export type ControlProps = PartComponentProps<"div", StateOf<Parts["control"]>>
export type TrackProps = PartComponentProps<"div", StateOf<Parts["track"]>>
export type IndicatorProps = PartComponentProps<"div", StateOf<Parts["indicator"]>>

const part =
  <Props extends Record<string, unknown>>(key: "control" | "track" | "indicator") =>
  (props: Props): JSX.Element => <Part of={useSlider()[key]} tag="div" {...props} />

export const Slider = {
  Root,
  Value,
  Control: part<ControlProps>("control"),
  Track: part<TrackProps>("track"),
  Indicator: part<IndicatorProps>("indicator"),
  Thumb,
}
