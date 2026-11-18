import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarProps,
  CalendarValue,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, createContext, createUniqueId, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["calendar"]

/**
 * The calendar its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the calendar's parts).
 */
const Context = createContext<Controller>()
/** For a component made of this one's parts: a date picker. */
export { Context as CalendarContext }

function useCalendar(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Calendar part must be inside <Calendar.Root>")
  return made
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<CalendarProps, "id"> & { id?: string }
>

function Root(props: RootProps): JSX.Element {
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
      <Part of={made.root} tag="div" {...rest} />
    </Context.Provider>
  )
}

export type HeadingProps = PartComponentProps<"div", StateOf<Parts["heading"]>>

/** Names the month shown, unless it is given something else to say. */
function Heading(props: HeadingProps): JSX.Element {
  const made = useCalendar()
  const title = fromSignal(made.title)
  return (
    <Part of={made.heading} tag="div" {...props}>
      {props.children ?? title()}
    </Part>
  )
}

export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>
export type GridProps = PartComponentProps<"table", StateOf<Parts["grid"]>>

const Previous = (props: PreviousProps) => (
  <Part of={useCalendar().previous} tag="button" {...props} />
)
const Next = (props: NextProps) => <Part of={useCalendar().next} tag="button" {...props} />
const Grid = (props: GridProps) => <Part of={useCalendar().grid} tag="table" {...props} />

export type WeekdaysProps = { children: (weekday: CalendarWeekday) => JSX.Element }

/** Draws its child once for each day of the week, in the locale's order. */
function Weekdays(props: WeekdaysProps): JSX.Element {
  const weekdays = fromSignal(useCalendar().weekdays)
  return <For each={weekdays()}>{(weekday) => props.children(weekday)}</For>
}

export type WeeksProps = { children: (week: readonly CalendarDay[]) => JSX.Element }

/** Draws its child once for each week of the month shown. */
function Weeks(props: WeeksProps): JSX.Element {
  const weeks = fromSignal(useCalendar().weeks)
  return <For each={weeks()}>{(week) => props.children(week)}</For>
}

export type HeadCellProps = PartComponentProps<
  "th",
  StateOf<Parts["headCell"]>,
  { weekday: CalendarWeekday }
>

function HeadCell(props: HeadCellProps): JSX.Element {
  const [local, rest] = splitProps(props, ["weekday"])
  const part = useCalendar().headCell(local.weekday)
  return <Part of={part} tag="th" {...rest} />
}

export type CellProps = PartComponentProps<"td", StateOf<Parts["cell"]>, { date: string }>

function Cell(props: CellProps): JSX.Element {
  const [local, rest] = splitProps(props, ["date"])
  // A cell is its day for as long as it is in the page.
  const part = useCalendar().cell(local.date)
  return <Part of={part} tag="td" {...rest} />
}

export type DayProps = PartComponentProps<"button", StateOf<Parts["day"]>, { date: string }>

function Day(props: DayProps): JSX.Element {
  const [local, rest] = splitProps(props, ["date"])
  const part = useCalendar().day(local.date)
  return <Part of={part} tag="button" {...rest} />
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
