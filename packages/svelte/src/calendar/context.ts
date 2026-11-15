import type { Calendar } from "@kirana-ui/core/calendar"
import { getContext, setContext } from "svelte"

const KEY = Symbol("Calendar")

export const provide = (controller: Calendar): Calendar => setContext(KEY, controller)

export function useCalendar(): Calendar {
  const controller = getContext<Calendar | undefined>(KEY)
  if (!controller) throw new Error("A Calendar part must be inside <Calendar.Root>")
  return controller
}
