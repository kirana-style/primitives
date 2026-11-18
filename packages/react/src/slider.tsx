import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type { Slider as Controller, SliderProps, SliderValue } from "@kirana-ui/core/slider"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { createContext, useContext, useId } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { PartElement, parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["slider"]

const Context = createContext<Controller | null>(null)

function useSlider(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Slider.${part}> must be inside <Slider.Root>`)
  return controller
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
function Root<Value extends SliderValue = number>({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step,
  largeStep,
  minStepsBetweenValues,
  thumbAlignment,
  orientation,
  disabled,
  readOnly,
  name,
  form,
  format,
  locale,
  getAriaValueText,
  id,
  ...rest
}: RootProps<Value>): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createSlider<Value>, { field, direction })
  const controller = useController(create, {
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    min,
    max,
    step,
    largeStep,
    minStepsBetweenValues,
    thumbAlignment,
    orientation,
    disabled,
    readOnly,
    name,
    form,
    format,
    locale,
    getAriaValueText,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <PartElement of={controller.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type ControlProps = PartComponentProps<"div", StateOf<Parts["control"]>>
export type TrackProps = PartComponentProps<"div", StateOf<Parts["track"]>>
export type IndicatorProps = PartComponentProps<"div", StateOf<Parts["indicator"]>>

const Control = (props: ControlProps) => usePart(useSlider("Control").control, "div", props)
const Track = (props: TrackProps) => usePart(useSlider("Track").track, "div", props)
const Indicator = (props: IndicatorProps) => usePart(useSlider("Indicator").indicator, "div", props)

export type ThumbProps = PartComponentProps<
  "div",
  StateOf<Parts["thumb"]>,
  {
    /**
     * Which value of a range the thumb is, from 0. A thumb that is given none takes its place
     * among the slider's thumbs, in the order they are written.
     */
    index?: number
  }
>

function Thumb({ index, ...rest }: ThumbProps): ReactElement {
  const controller = useSlider("Thumb")
  // The same on every render of this thumb, a second one in StrictMode included.
  const generated = useId()
  const at = index ?? generated
  // Its native input is the element's last child, whatever element the caller asked for.
  return usePart(controller.thumb(at), "div", rest, undefined, (content) => (
    <>
      {content}
      <PartElement of={controller.thumbInput(at)} tag="input" />
    </>
  ))
}

export type ValueProps = PartComponentProps<
  "output",
  StateOf<Parts["value"]>,
  {
    /** Draws something else than the written value: it is given the text, and each thumb's value. */
    children?: (text: string, values: readonly number[]) => ReactNode
  }
>

/** The written value, or what `children` makes of it and of the values. */
function Value({ children, ...props }: ValueProps): ReactElement {
  const controller = useSlider("Value")
  const text = useSignal(controller.text)
  const values = useSignal(controller.values)
  return usePart(controller.value, "output", {
    ...props,
    children: children ? children(text, values) : text,
  })
}

export const Slider = /* @__PURE__ */ parts("Slider", {
  Root,
  Value,
  Control,
  Track,
  Indicator,
  Thumb,
})
