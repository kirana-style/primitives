import { within } from "@kirana-ui/core"
import type { Part } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type { Slider as Controller, SliderProps } from "@kirana-ui/core/slider"
import { createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useSlider(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Slider.${part}> must be inside <Slider.Root>`)
  return controller
}

export type RootProps = Omit<SliderProps, "id"> & { id?: string } & PartComponentProps

function Root({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step,
  largeStep,
  minStepsBetweenValues,
  orientation,
  disabled,
  name,
  form,
  format,
  locale,
  getAriaValueText,
  id,
  ...rest
}: RootProps): ReactElement {
  const field = useContext(FieldContext) ?? undefined
  const direction = useContext(DirectionContext) ?? undefined
  const create = within(createSlider, { field, direction })
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
    orientation,
    disabled,
    name,
    form,
    format,
    locale,
    getAriaValueText,
    id,
  })
  return (
    <Context.Provider value={controller}>
      <RootElement {...rest} />
    </Context.Provider>
  )
}

const RootElement = (props: PartComponentProps) => usePart(useSlider("Root").root, "div", props)
const Control = (props: PartComponentProps) => usePart(useSlider("Control").control, "div", props)
const Track = (props: PartComponentProps) => usePart(useSlider("Track").track, "div", props)
const Indicator = (props: PartComponentProps) =>
  usePart(useSlider("Indicator").indicator, "div", props)

const PartElement = ({ part, tag, ...props }: PartComponentProps & { part: Part; tag: string }) =>
  usePart(part, tag, props)

export interface ThumbProps extends PartComponentProps {
  /** Which value of a range the thumb is, from 0. */
  index?: number
}

function Thumb({ index = 0, children, ...rest }: ThumbProps): ReactElement {
  const controller = useSlider("Thumb")
  return (
    <PartElement part={controller.thumb(index)} tag="div" {...rest}>
      {children}
      <PartElement part={controller.thumbInput(index)} tag="input" />
    </PartElement>
  )
}

/** The written value, or what `children` makes of it and of the values. */
function Value({
  children,
  ...props
}: Omit<PartComponentProps, "children"> & {
  children?: (text: string, values: readonly number[]) => ReactNode
}): ReactElement {
  const controller = useSlider("Value")
  const text = useSignal(controller.text)
  const values = useSignal(controller.values)
  return usePart(controller.value, "output", {
    ...props,
    children: children ? children(text, values) : text,
  })
}

export const Slider = { Root, Value, Control, Track, Indicator, Thumb }
