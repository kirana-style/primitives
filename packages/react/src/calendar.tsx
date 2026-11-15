import { within } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar as Controller,
  CalendarDay,
  CalendarProps,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"
import { Fragment, createContext, useContext, useMemo } from "react"
import type { ReactElement, ReactNode } from "react"

import { DirectionContext } from "./direction-context.ts"
import { useController, usePart, useSignal } from "./runtime.tsx"
import type { PartComponentProps } from "./runtime.tsx"

const Context = createContext<Controller | null>(null)

function useCalendar(part: string): Controller {
  const controller = useContext(Context)
  if (!controller) throw new Error(`<Calendar.${part}> must be inside <Calendar.Root>`)
  return controller
}

export type RootProps = Omit<CalendarProps, "id"> & { id?: string } & PartComponentProps

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

/** Names the month shown, unless it is given something else to say. */
function Heading({ children, ...props }: PartComponentProps): ReactElement {
  const controller = useCalendar("Heading")
  const title = useSignal(controller.title)
  return usePart(controller.heading, "div", { ...props, children: children ?? title })
}

const Previous = (props: PartComponentProps) =>
  usePart(useCalendar("Previous").previous, "button", props)
const Next = (props: PartComponentProps) => usePart(useCalendar("Next").next, "button", props)
const Grid = (props: PartComponentProps) => usePart(useCalendar("Grid").grid, "table", props)

/** Draws its child once for each day of the week, in the locale's order. */
function Weekdays({ children }: { children: (weekday: CalendarWeekday) => ReactNode }) {
  const weekdays = useSignal(useCalendar("Weekdays").weekdays)
  return (
    <>
      {weekdays.map((weekday) => (
        <Fragment key={weekday.index}>{children(weekday)}</Fragment>
      ))}
    </>
  )
}

/** Draws its child once for each week of the month shown. */
function Weeks({ children }: { children: (week: readonly CalendarDay[]) => ReactNode }) {
  const weeks = useSignal(useCalendar("Weeks").weeks)
  return (
    <>
      {weeks.map((week) => (
        <Fragment key={week[0]!.date}>{children(week)}</Fragment>
      ))}
    </>
  )
}

function HeadCell({ weekday, ...props }: PartComponentProps & { weekday: CalendarWeekday }) {
  const controller = useCalendar("HeadCell")
  const part = useMemo(() => controller.headCell(weekday), [controller, weekday])
  return usePart(part, "th", props)
}

function Cell({ date, ...props }: PartComponentProps & { date: string }): ReactElement {
  return usePart(useCalendar("Cell").cell(date), "td", props)
}

function Day({ date, ...props }: PartComponentProps & { date: string }): ReactElement {
  return usePart(useCalendar("Day").day(date), "button", props)
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
