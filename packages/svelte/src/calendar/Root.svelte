<script lang="ts">
  import type { ChangeDetails } from "@kirana-ui/core"
  import type { CalendarProps, CalendarValue } from "@kirana-ui/core/calendar"
  import { within } from "@kirana-ui/core"
  import { createCalendar } from "@kirana-ui/core/calendar"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "../types.ts"

  let {
    value = $bindable(),
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
  }: RootProps<CalendarProps> = $props()
  const generated = $props.id()

  function change(next: CalendarValue, by: ChangeDetails) {
    onValueChange?.(next, by)
    // Written back only to a caller who holds it.
    if (!by.canceled && value !== undefined) value = next
  }

  const made = provide(
    controller(within(createCalendar, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
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
      onValueChange: change,
    }))
  )
</script>

<Part part={made.root} tag="div" {...rest} />
