import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createDateField } from "@kirana-ui/core/date-field"
import type {
  DateField as Controller,
  DateFieldProps,
  DateFieldSegment,
} from "@kirana-ui/core/date-field"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["dateField"]

/**
 * The date field its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the date field's parts).
 */
const Context = createContext<Controller | null>(null)
/** For a component made of this one's parts: a date picker. */
export { Context as DateFieldContext }

function useDateField(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<DateField.${part}> must be inside <DateField.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<DateFieldProps, "id"> & { id?: string }
>

function Root({
  value,
  defaultValue,
  onValueChange,
  locale,
  calendarSystem,
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
  const controller = useController<DateFieldProps, Controller>(
    within(createDateField, { direction }),
    {
      value,
      defaultValue,
      onValueChange,
      locale,
      calendarSystem,
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
  /** Draws one piece of the date, once for each: a part that is typed, or what stands between two. */
  children: (segment: DateFieldSegment) => ReactNode
}

/** Draws its child once for each piece of the date, in the locale's order. */
function Segments({ children }: SegmentsProps) {
  const segments = useSignal(useDateField("Segments").segments)
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
    /** The piece it is: an entry `DateField.Segments` gave. */
    segment: DateFieldSegment
  }
>

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
function Segment({ segment, ...props }: SegmentProps): ReactElement {
  const { part, text } = useDateField("Segment").segment(segment)
  const shown = useSignal(text)
  // Its text is the field's to write: the browser never edits it, whatever React fears.
  return usePart(part, "span", { ...props, suppressContentEditableWarning: true, children: shown })
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

const Input = (props: InputProps) => usePart(useDateField("Input").input, "input", props)

export const DateField = /* @__PURE__ */ parts("DateField", { Root, Segments, Segment, Input })
