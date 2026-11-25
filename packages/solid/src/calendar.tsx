import { within } from "@kirana-ui/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarMode,
  CalendarMonth,
  CalendarProps,
  CalendarValue,
  CalendarValueOf,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { For, createContext, createUniqueId, untrack, useContext } from "solid-js"
import type { JSX } from "@solidjs/web"

import { DirectionContext } from "./direction-context.ts"
import { Part, controller, fromSignal, split } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["calendar"]

/**
 * The calendar its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the calendar's parts).
 */
const Context = createContext<Controller | null>(null)
/** For a component made of this one's parts: a date picker. */
export { Context as CalendarContext }

function useCalendar(): Controller {
  const made = useContext(Context)
  if (!made) throw new Error("A Calendar part must be inside <Calendar.Root>")
  return made
}

/** The place of the month its parts are drawn in, inside `Calendar.Months`. */
const MonthContext = createContext<number | null>(null)
// The day a cell holds, for the day button inside it.
const CellContext = createContext<string | null>(null)
/** The month a part is drawn in: the one `Calendar.Months` gave, or the first. */
const useMonth = () => useCalendar().monthAt(useContext(MonthContext) ?? 0)

/** `value` and `onValueChange` are typed by `mode`: a day, a range, or a list of days. */
export type RootProps<Mode extends CalendarMode = "single"> = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<CalendarProps<Mode>, "id"> & { id?: string }
>

function Root<Mode extends CalendarMode = "single">(props: RootProps<Mode>): JSX.Element {
  const [local, rest] = split(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "mode",
    "required",
    "minDays",
    "maxDays",
    "months",
    "pagedNavigation",
    "month",
    "defaultMonth",
    "onMonthChange",
    "defaultFocusedValue",
    "locale",
    "calendarSystem",
    "min",
    "max",
    "isDateUnavailable",
    "disabled",
    "readOnly",
    "fixedWeeks",
    "name",
    "form",
    "id",
  ])
  const generated = createUniqueId()
  const direction = useContext(DirectionContext) ?? undefined
  const made = controller(within(createCalendar, { direction }), () => ({
    id: local.id ?? generated,
    // The core holds any mode's value; the caller's is its mode's.
    value: local.value as CalendarValue | undefined,
    defaultValue: local.defaultValue as CalendarValue | undefined,
    mode: local.mode,
    required: local.required,
    minDays: local.minDays,
    maxDays: local.maxDays,
    months: local.months,
    pagedNavigation: local.pagedNavigation,
    month: local.month,
    defaultMonth: local.defaultMonth,
    defaultFocusedValue: local.defaultFocusedValue,
    locale: local.locale,
    calendarSystem: local.calendarSystem,
    min: local.min,
    max: local.max,
    isDateUnavailable: local.isDateUnavailable,
    disabled: local.disabled,
    readOnly: local.readOnly,
    fixedWeeks: local.fixedWeeks,
    name: local.name,
    form: local.form,
    onValueChange: (value: CalendarValue, details: ChangeDetails) =>
      local.onValueChange?.(value as CalendarValueOf<Mode>, details),
    onMonthChange: (month: string, details: ChangeDetails) => local.onMonthChange?.(month, details),
  }))
  return (
    <Context value={made}>
      <Part of={made.root} tag="div" {...rest} />
    </Context>
  )
}

export type HeadingProps = PartComponentProps<"div", StateOf<Parts["heading"]>>

/** Names the month shown, unless it is given something else to say. */
function Heading(props: HeadingProps): JSX.Element {
  const month = useMonth()
  const title = fromSignal(month.title)
  return (
    <Part of={month.heading} tag="div" {...props}>
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
const Grid = (props: GridProps) => <Part of={useMonth().grid} tag="table" {...props} />

export type MonthsProps = { children: (month: CalendarMonth) => JSX.Element }

/**
 * Draws its child once for each month shown (`months` on the root), side by side: the parts
 * inside each are that month's. Left out for one month.
 */
function Months(props: MonthsProps): JSX.Element {
  const months = fromSignal(useCalendar().months)
  // Kept by place: the month given reads the one now there, as props do.
  return (
    <For each={months()} keyed={false}>
      {(month, index) => (
        <MonthContext value={index}>
          {props.children({
            index,
            get month() {
              return month().month
            },
            get title() {
              return month().title
            },
            get weekdays() {
              return month().weekdays
            },
            get weeks() {
              return month().weeks
            },
          })}
        </MonthContext>
      )}
    </For>
  )
}

export type WeekdaysProps = { children: (weekday: CalendarWeekday) => JSX.Element }

/** Draws its child once for each day of the week, in the locale's order. */
function Weekdays(props: WeekdaysProps): JSX.Element {
  const weekdays = fromSignal(useCalendar().weekdays)
  return <For each={weekdays()}>{(weekday) => props.children(weekday)}</For>
}

export type WeeksProps = { children: (week: readonly CalendarDay[]) => JSX.Element }

/**
 * Draws its child once for each week of the month shown. A week is kept by its first day, as on
 * the other adapters, and each of its days is kept by its place, reading the week now there: a
 * day still shown when the month changes keeps its element, and focus, whether the list drawn
 * inside is keyed or not.
 */
function Weeks(props: WeeksProps): JSX.Element {
  const weeks = fromSignal(useMonth().weeks)
  return (
    <For each={weeks()} keyed={(week) => week[0]!.date}>
      {(week) =>
        props.children(
          untrack(week).map((_, at) => ({
            get date() {
              return week()[at]!.date
            },
            get label() {
              return week()[at]!.label
            },
            get outside() {
              return week()[at]!.outside
            },
          }))
        )
      }
    </For>
  )
}

export type HeadCellProps = PartComponentProps<
  "th",
  StateOf<Parts["headCell"]>,
  { weekday: CalendarWeekday }
>

function HeadCell(props: HeadCellProps): JSX.Element {
  const [local, rest] = split(props, ["weekday"])
  const part = useCalendar().headCell(local.weekday)
  return <Part of={part} tag="th" {...rest} />
}

export type CellProps = PartComponentProps<
  "td",
  StateOf<Parts["cell"]>,
  {
    /** The day it holds, as `Calendar.Weeks` gave it. A `Day` inside takes it too. */
    date: string
  }
>

function Cell(props: CellProps): JSX.Element {
  const [local, rest] = split(props, ["date"])
  // A cell is its day for as long as it is in the page.
  const date = untrack(() => local.date)
  const part = useCalendar().cell(date, useContext(MonthContext) ?? undefined)
  return (
    <CellContext value={date}>
      <Part of={part} tag="td" {...rest} />
    </CellContext>
  )
}

export type DayProps = PartComponentProps<
  "button",
  StateOf<Parts["day"]>,
  {
    /** The day it is the button of. Left out, the `Calendar.Cell`'s it is inside. */
    date?: string
  }
>

function Day(props: DayProps): JSX.Element {
  const [local, rest] = split(props, ["date"])
  const date = untrack(() => local.date) ?? useContext(CellContext)
  if (date == null) throw new Error("<Calendar.Day> needs a date or a <Calendar.Cell> around it")
  const part = useCalendar().day(date, useContext(MonthContext) ?? undefined)
  return <Part of={part} tag="button" {...rest} />
}

export type InputProps = PartComponentProps<"input", StateOf<Parts["input"]>>

/** The hidden input the value is submitted by, when the root has a `name`. */
const Input = (props: InputProps) => <Part of={useCalendar().input} tag="input" {...props} />

export const Calendar = {
  Root,
  Heading,
  Previous,
  Next,
  Months,
  Grid,
  Weekdays,
  HeadCell,
  Weeks,
  Cell,
  Day,
  Input,
}
