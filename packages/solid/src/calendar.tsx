import { within } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarProps,
  CalendarValue,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import { For, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller>()
/** For a component made of this one's parts: a date picker. */
export { Context as CalendarContext }

function useCalendar(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Calendar part must be inside <Calendar.Root>")
  return made
}

function Root(
  props: PartComponentProps & Omit<CalendarProps, "id"> & { id?: string }
): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "mode",
    "defaultFocusedValue",
    "onMonthChange",
    "locale",
    "calendarSystem",
    "min",
    "max",
    "isDateUnavailable",
    "disabled",
    "readOnly",
    "fixedWeeks",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext)
  const made = controller(within(createCalendar, { direction }), () => ({
    id: local.id ?? generated,
    value: local.value,
    defaultValue: local.defaultValue,
    mode: local.mode,
    defaultFocusedValue: local.defaultFocusedValue,
    locale: local.locale,
    calendarSystem: local.calendarSystem,
    min: local.min,
    max: local.max,
    isDateUnavailable: local.isDateUnavailable,
    disabled: local.disabled,
    readOnly: local.readOnly,
    fixedWeeks: local.fixedWeeks,
    onValueChange: (value: CalendarValue, details: ChangeDetails) =>
      local.onValueChange?.(value, details),
    onMonthChange: (month: string) => local.onMonthChange?.(month),
  }))
  return (
    <Context.Provider value={made}>
      <Part part={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

/** Names the month shown, unless it is given something else to say. */
function Heading(props: PartComponentProps): JSX.Element {
  const made = useCalendar()
  const title = fromSignal(made.title)
  return (
    <Part part={made.heading} tag="div" {...props}>
      {props.children ?? title()}
    </Part>
  )
}

const Previous = (props: PartComponentProps) => (
  <Part part={useCalendar().previous} tag="button" {...props} />
)
const Next = (props: PartComponentProps) => (
  <Part part={useCalendar().next} tag="button" {...props} />
)
const Grid = (props: PartComponentProps) => (
  <Part part={useCalendar().grid} tag="table" {...props} />
)

/** Draws its child once for each day of the week, in the locale's order. */
function Weekdays(props: { children: (weekday: CalendarWeekday) => JSX.Element }): JSX.Element {
  const weekdays = fromSignal(useCalendar().weekdays)
  return <For each={weekdays()}>{(weekday) => props.children(weekday)}</For>
}

/** Draws its child once for each week of the month shown. */
function Weeks(props: { children: (week: readonly CalendarDay[]) => JSX.Element }): JSX.Element {
  const weeks = fromSignal(useCalendar().weeks)
  return <For each={weeks()}>{(week) => props.children(week)}</For>
}

function HeadCell(props: PartComponentProps & { weekday: CalendarWeekday }): JSX.Element {
  const [local, rest] = splitProps(props, ["weekday"])
  const part = useCalendar().headCell(local.weekday)
  return <Part part={part} tag="th" {...rest} />
}

function Cell(props: PartComponentProps & { date: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["date"])
  // A cell is its day for as long as it is in the page.
  const part = useCalendar().cell(local.date)
  return <Part part={part} tag="td" {...rest} />
}

function Day(props: PartComponentProps & { date: string }): JSX.Element {
  const [local, rest] = splitProps(props, ["date"])
  const part = useCalendar().day(local.date)
  return <Part part={part} tag="button" {...rest} />
}

export const Calendar = {
  Root,
  Heading,
  Previous,
  Next,
  Grid,
  Weekdays,
  HeadCell,
  Weeks,
  Cell,
  Day,
}
