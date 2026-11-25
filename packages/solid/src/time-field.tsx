import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createTimeField } from "@kirana-ui/core/time-field"
import type {
  IsoTime,
  TimeField as Controller,
  TimeFieldProps,
  TimeFieldSegment,
} from "@kirana-ui/core/time-field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, createContext, createUniqueId, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["timeField"]

const Context = createContext<Controller | null>(null)

function useTimeField(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A TimeField part must be inside <TimeField.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TimeFieldProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "granularity",
    "hourCycle",
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
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createTimeField, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    granularity: local.granularity,
    hourCycle: local.hourCycle,
    locale: local.locale,
    min: local.min,
    max: local.max,
    placeholders: local.placeholders,
    disabled: local.disabled,
    readOnly: local.readOnly,
    required: local.required,
    name: local.name,
    form: local.form,
    onValueChange: (value: IsoTime | null, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type SegmentsProps = {
  /** Draws one piece of the time, once for each: a part that is typed, or what stands between two. */
  children: (segment: TimeFieldSegment) => JSX.Element
}

/** Draws its child once for each piece of the time, in the locale's order. */
function Segments(props: SegmentsProps): JSX.Element {
  const segments = fromSignal(useTimeField().segments)
  return <For each={segments()}>{(segment) => props.children(segment)}</For>
}

export type SegmentProps = PartComponentProps<
  "span",
  StateOf<Parts["segment"]>,
  {
    /** The piece it is: an entry `TimeField.Segments` gave. */
    segment: TimeFieldSegment
  }
>

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
function Segment(props: SegmentProps): JSX.Element {
  const [local, rest] = split(props, ["segment"])
  const made = useTimeField().segment(local.segment)
  const shown = fromSignal(made.text)
  return (
    <Part of={made.part} tag="span" {...rest}>
      {shown()}
    </Part>
  )
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => <Part of={useTimeField().input} tag="input" {...props} />

export const TimeField = { Root, Segments, Segment, Input }
