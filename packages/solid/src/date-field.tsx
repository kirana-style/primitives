import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createDateField } from "@kirana-ui/core/date-field"
import type {
  DateField as Controller,
  DateFieldProps,
  DateFieldSegment,
} from "@kirana-ui/core/date-field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["dateField"]

/**
 * The date field its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the date field's parts).
 */
const Context = createContext<Controller | null>(null)
/** For a component made of this one's parts: a date picker. */
export { Context as DateFieldContext }

function useDateField(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A DateField part must be inside <DateField.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<DateFieldProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "locale",
    "calendarSystem",
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
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createDateField, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    locale: local.locale,
    calendarSystem: local.calendarSystem,
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
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type SegmentsProps = { children: (segment: DateFieldSegment) => JSX.Element }

/** Draws its child once for each piece of the date, in the locale's order. */
function Segments(props: SegmentsProps): JSX.Element {
  const segments = fromSignal(useDateField().segments)
  return <For each={segments()}>{(segment) => props.children(segment)}</For>
}

export type SegmentProps = PartComponentProps<
  "span",
  StateOf<Parts["segment"]>,
  { segment: DateFieldSegment }
>

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
function Segment(props: SegmentProps): JSX.Element {
  const [local, rest] = split(props, ["segment"])
  const made = useDateField().segment(local.segment)
  const shown = fromSignal(made.text)
  return (
    <Part of={made.part} tag="span" {...rest}>
      {shown()}
    </Part>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => <Part of={useDateField().input} tag="input" {...props} />

export const DateField = { Root, Segments, Segment, Input }
