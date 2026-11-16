import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDateField } from "@kirana-ui/core/date-field"
import type {
  DateField as Controller,
  DateFieldProps,
  DateFieldSegment,
} from "@kirana-ui/core/date-field"
import { For, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
/** For a component made of this one's parts: a date picker. */
export { Context as DateFieldContext }

function useDateField(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A DateField part must be inside <DateField.Root>")
  return made
}

function Root(
  props: PartComponentProps & Omit<DateFieldProps, "id"> & { id?: string }
): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "locale",
    "min",
    "max",
    "placeholders",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createDateField, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    locale: local.locale,
    min: local.min,
    max: local.max,
    placeholders: local.placeholders,
    disabled: local.disabled,
    readOnly: local.readOnly,
    required: local.required,
    name: local.name,
    form: local.form,
    onValueChange: (value: string | null, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

/** Draws its child once for each piece of the date, in the locale's order. */
function Segments(props: { children: (segment: DateFieldSegment) => JSX.Element }): JSX.Element {
  const segments = fromSignal(useDateField().segments)
  return <For each={segments()}>{(segment) => props.children(segment)}</For>
}

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
function Segment(props: PartComponentProps & { segment: DateFieldSegment }): JSX.Element {
  const [local, rest] = splitProps(props, ["segment"])
  const made = useDateField().segment(local.segment)
  const shown = fromSignal(made.text)
  return (
    <Part part={made.part} tag="span" {...rest}>
      {shown()}
    </Part>
  )
}

const Input = (props: PartComponentProps) => (
  <Part part={useDateField().input} tag="input" {...props} />
)

export const DateField = { Root, Segments, Segment, Input }
