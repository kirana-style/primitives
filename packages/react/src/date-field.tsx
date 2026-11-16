import { within } from "@kirana-ui/core"
import { createDateField } from "@kirana-ui/core/date-field"
import type {
  DateField as Controller,
  DateFieldProps,
  DateFieldSegment,
} from "@kirana-ui/core/date-field"
import { Fragment, createContext, useContext } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)
/** For a component made of this one's parts: a date picker. */
export { Context as DateFieldContext }

function useDateField(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<DateField.${part}> must be inside <DateField.Root>`)
  return controller
}

export type RootProps = Omit<DateFieldProps, "id"> & { id?: string } & PartComponentProps

function Root({
  value,
  defaultValue,
  onValueChange,
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
  const controller = useController<DateFieldProps, Controller>(
    within(createDateField, { direction }),
    {
      value,
      defaultValue,
      onValueChange,
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

/** Draws its child once for each piece of the date, in the locale's order. */
function Segments({ children }: { children: (segment: DateFieldSegment) => ReactNode }) {
  const segments = useSignal(useDateField("Segments").segments)
  return (
    <>
      {segments.map((segment) => (
        <Fragment key={`${segment.index}-${segment.type}`}>{children(segment)}</Fragment>
      ))}
    </>
  )
}

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
function Segment({
  segment,
  ...props
}: PartComponentProps & { segment: DateFieldSegment }): ReactElement {
  const { part, text } = useDateField("Segment").segment(segment)
  const shown = useSignal(text)
  // Its text is the field's to write: the browser never edits it, whatever React fears.
  return usePart(part, "span", { ...props, suppressContentEditableWarning: true, children: shown })
}

const Input = (props: PartComponentProps) => usePart(useDateField("Input").input, "input", props)

export const DateField = { Root, Segments, Segment, Input }
