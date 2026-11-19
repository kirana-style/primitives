import type { Calendar, CalendarMonthParts } from "@kirana-ui/core/calendar"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Calendar")
const MONTH = Symbol("CalendarMonth")

export const provide = (controller: Calendar): Calendar => setContext(KEY, controller)

export function useCalendar(): Calendar {
  const controller = getContext<Calendar | undefined>(KEY)
  if (!controller) throw new Error("A Calendar part must be inside <Calendar.Root>")
  return controller
}

/** Says which month the parts inside are drawn in: `Calendar.Months` does, for each. */
export const provideMonth = (index: number): number => setContext(MONTH, index)

/** The place of the month a part is drawn in, inside `Calendar.Months`. */
export const monthIndex = (): number | undefined => getContext<number | undefined>(MONTH)

/** The month a part is drawn in: the one `Calendar.Months` gave, or the first. */
export const useMonth = (): CalendarMonthParts => useCalendar().monthAt(monthIndex() ?? 0)
