import type { DatePicker } from "@kirana-ui/core/date-picker"
import { getContext, setContext } from "svelte"

const KEY = Symbol("DatePicker")

export const provide = (controller: DatePicker): DatePicker => setContext(KEY, controller)

export function useDatePicker(): DatePicker {
  const controller = getContext<DatePicker | undefined>(KEY)
  if (!controller) throw new Error("A DatePicker part must be inside <DatePicker.Root>")
  return controller
}
