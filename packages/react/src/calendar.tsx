import { within } from "@kirana-ui/core"
import type { StateOf } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarProps,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"
import { Fragment, createContext, useContext, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { parts, useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

type Parts = Vocabulary["calendar"]

/**
 * The calendar its parts are inside. Exported for a component that is made of one (a date picker
 * provides its own to the calendar's parts).
 */
const Context = createContext<Controller | null>(null)
/** For a component made of this one's parts: a date picker. */
export { Context as CalendarContext }

function useCalendar(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Calendar.${part}> must be inside <Calendar.Root>`)
  return controller
}

export type RootProps = PartComponentProps<
  "div",
  StateOf<Parts["root"]>,
  Omit<CalendarProps, "id"> & { id?: string }
>

function Root({
  value,
  defaultValue,
  onValueChange,
  mode,
  defaultFocusedValue,
  onMonthChange,
  locale,
  calendarSystem,
  min,
  max,
  isDateUnavailable,
  disabled,
  readOnly,
  fixedWeeks,
  id,
  ...rest
}: RootProps): ReactElement {
  const direction = useContext(DirectionContext) ?? undefined
  const controller = useController<CalendarProps, Controller>(
    within(createCalendar, { direction }),
    {
      value,
      defaultValue,
      onValueChange,
      mode,
      defaultFocusedValue,
      onMonthChange,
      locale,
      calendarSystem,
      min,
      max,
      isDateUnavailable,
      disabled,
      readOnly,
      fixedWeeks,
      id,
    }
  )
  return (
    <Context.Provider value={controller}>{usePart(controller.root, "div", rest)}</Context.Provider>
  )
}

export type HeadingProps = PartComponentProps<"div", StateOf<Parts["heading"]>>

/** Names the month shown, unless it is given something else to say. */
function Heading({ children, ...props }: HeadingProps): ReactElement {
  const controller = useCalendar("Heading")
  const title = useSignal(controller.title)
  return usePart(controller.heading, "div", { ...props, children: children ?? title })
}

export type PreviousProps = PartComponentProps<"button", StateOf<Parts["previous"]>>

const Previous = (props: PreviousProps) =>
  usePart(useCalendar("Previous").previous, "button", props)
export type NextProps = PartComponentProps<"button", StateOf<Parts["next"]>>

const Next = (props: NextProps) => usePart(useCalendar("Next").next, "button", props)
export type GridProps = PartComponentProps<"table", StateOf<Parts["grid"]>>

const Grid = (props: GridProps) => usePart(useCalendar("Grid").grid, "table", props)

export interface WeekdaysProps {
  /** Draws one day of the week, once for each: its heading cell. */
  children: (weekday: CalendarWeekday) => ReactNode
}

/** Draws its child once for each day of the week, in the locale's order. */
function Weekdays({ children }: WeekdaysProps) {
  const weekdays = useSignal(useCalendar("Weekdays").weekdays)
  return (
    <>
      {weekdays.map((weekday) => (
        <Fragment key={weekday.index}>{children(weekday)}</Fragment>
      ))}
    </>
  )
}

export interface WeeksProps {
  /** Draws one week, once for each of the month shown: a row of its days. */
  children: (week: readonly CalendarDay[]) => ReactNode
}

/** Draws its child once for each week of the month shown. */
function Weeks({ children }: WeeksProps) {
  const weeks = useSignal(useCalendar("Weeks").weeks)
  return (
    <>
      {weeks.map((week) => (
        <Fragment key={week[0]!.date}>{children(week)}</Fragment>
      ))}
    </>
  )
}

export type HeadCellProps = PartComponentProps<
  "th",
  StateOf<Parts["headCell"]>,
  {
    /** The day of the week it heads: an entry `Calendar.Weekdays` gave. */
    weekday: CalendarWeekday
  }
>

function HeadCell({ weekday, ...props }: HeadCellProps): ReactElement {
  const controller = useCalendar("HeadCell")
  const part = useMemo(() => controller.headCell(weekday), [controller, weekday])
  return usePart(part, "th", props)
}

export type CellProps = PartComponentProps<
  "td",
  StateOf<Parts["cell"]>,
  {
    /** The day it holds, as `Calendar.Weeks` gave it: `day.date`. */
    date: string
  }
>

function Cell({ date, ...props }: CellProps): ReactElement {
  return usePart(useCalendar("Cell").cell(date), "td", props)
}

export type DayProps = PartComponentProps<
  "button",
  StateOf<Parts["day"]>,
  {
    /** The day it is the button of, as `Calendar.Weeks` gave it: `day.date`. */
    date: string
  }
>

function Day({ date, ...props }: DayProps): ReactElement {
  return usePart(useCalendar("Day").day(date), "button", props)
}

export const Calendar = /* @__PURE__ */ parts("Calendar", {
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
})
