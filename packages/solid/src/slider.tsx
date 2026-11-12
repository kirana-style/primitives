import { createSlider } from "@kirana-ui/core/slider"
import type { Slider as Controller, SliderChangeDetails, SliderProps } from "@kirana-ui/core/slider"
import { createContext, createUniqueId, splitProps, untrack, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()

function useSlider(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Slider part must be inside <Slider.Root>")
  return made
}

export type RootProps = PartComponentProps & Omit<SliderProps, "id"> & { id?: string }

function Root(props: RootProps): JSX.Element {
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
    "orientation",
    "disabled",
    "name",
    "format",
    "locale",
    "getAriaValueText",
    "id",
  ])
  const generated = createUniqueId()
  const made = controller(createSlider, () => ({
    ...local,
    id: local.id ?? generated,
    onValueChange: (value: number | number[], details: SliderChangeDetails) =>
      local.onValueChange?.(value, details),
    onValueCommitted: (value: number | number[], details: SliderChangeDetails) =>
      local.onValueCommitted?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

/** `index` is which value of a range the thumb is, from 0. */
function Thumb(props: PartComponentProps & { index?: number }): JSX.Element {
  const [local, rest] = splitProps(props, ["index", "children"])
  // A thumb is its index for as long as it is in the page.
  const index = untrack(() => local.index ?? 0)
  const slider = useSlider()
  return (
    <Part part={slider.thumb(index)} tag="div" {...rest}>
      {local.children}
      <Part part={slider.thumbInput(index)} tag="input" />
    </Part>
  )
}

/** The written value, or what its child, a function, makes of it and of the values. */
function Value(
  props: Omit<PartComponentProps, "children"> & {
    children?: (text: () => string, values: () => readonly number[]) => JSX.Element
  }
): JSX.Element {
  const [local, rest] = splitProps(props, ["children"])
  const made = useSlider()
  const text = fromSignal(made.text)
  const values = fromSignal(made.values)
  return (
    <Part part={made.value} tag="output" {...rest}>
      {local.children ? local.children(text, values) : text()}
    </Part>
  )
}

const part = (key: "control" | "track" | "indicator") => (props: PartComponentProps) => (
  <Part part={useSlider()[key]} tag="div" {...props} />
)

export const Slider = {
  Root,
  Value,
  Control: part("control"),
  Track: part("track"),
  Indicator: part("indicator"),
  Thumb,
}
