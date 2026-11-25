import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createTimeField } from "@kirana-ui/core/time-field"
import type {
  TimeField as Controller,
  TimeFieldProps,
  TimeFieldSegment,
} from "@kirana-ui/core/time-field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { FieldContext } from "./field-context.ts"
import { parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["timeField"]

const Context = createContext<Controller | null>(null)

function useTimeField(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<TimeField.${part}> must be inside <TimeField.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<TimeFieldProps, "id"> & { id?: string }
>

function Root({
  value,
  defaultValue,
  onValueChange,
  granularity,
  hourCycle,
  locale,
  min,
  max,
  placeholders,
  disabled,
  readOnly,
  required,
  name,
  form,
  id,
  ...rest
}: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const field = useContext(FieldContext) ?? undefined
  const controller = useController<TimeFieldProps, Controller>(
    within(createTimeField, { direction, field }),
    {
      value,
      defaultValue,
      onValueChange,
      granularity,
      hourCycle,
      locale,
      min,
      max,
      placeholders,
      disabled,
      readOnly,
      required,
      name,
      form,
      id,
    }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export interface SegmentsProps {
  /** Draws one piece of the time, once for each: a part that is typed, or what stands between two. */
  children: (segment: TimeFieldSegment) => ReactNode
}

/** Draws its child once for each piece of the time, in the locale's order. */
function Segments({ children }: SegmentsProps) {
  const segments = useSignal(useTimeField("Segments").segments)
  return (
    <>
      {segments.map((segment) => (
        <Fragment key={`${segment.index}-${segment.type}`}>{children(segment)}</Fragment>
      ))}
    </>
  )
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
function Segment({ segment, ...props }: SegmentProps): ReactElement {
  const { part, text } = useTimeField("Segment").segment(segment)
  const shown = useSignal(text)
  // Its text is the field's to write: the browser never edits it, whatever React fears.
  return usePart(part, "span", { ...props, suppressContentEditableWarning: true, children: shown })
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => usePart(useTimeField("Input").input, "input", props)

export const TimeField = /* @__PURE__ */ parts("TimeField", { Root, Segments, Segment, Input })
