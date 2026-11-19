<script lang="ts" generics="Mode extends CalendarMode = 'single'">
  import type { ChangeDetails } from "@kirana-ui/core"
  import type { CalendarMode, CalendarValue, CalendarValueOf } from "@kirana-ui/core/calendar"
  import { within } from "@kirana-ui/core"
  import { createCalendar } from "@kirana-ui/core/calendar"

  import Part from "../Part.svelte"
  import { useDirectionAround } from "../direction/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    mode,
    minDays,
    maxDays,
    months,
    pagedNavigation,
    month = $bindable(),
    defaultMonth,
    onMonthChange,
    defaultFocusedValue,
    locale,
    calendarSystem,
    min,
    max,
    isDateUnavailable,
    disabled,
    readOnly,
    fixedWeeks,
    name,
    form,
    id,
    ...rest
  }: RootProps<Mode> = $props()
  const generated = $props.id()

  // The core holds any mode's value; the caller's is its mode's.
  function change(next: CalendarValue, by: ChangeDetails) {
    onValueChange?.(next as CalendarValueOf<Mode>, by)
    // Written back only to a caller who holds it.
    if (!by.canceled && value !== undefined) value = next as CalendarValueOf<Mode>
  }

  function turn(next: string, by: ChangeDetails) {
    onMonthChange?.(next, by)
    if (!by.canceled && month !== undefined) month = next
  }

  const made = provide(
    controller(within(createCalendar, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value: value as CalendarValue | undefined,
      defaultValue: defaultValue as CalendarValue | undefined,
      mode,
      minDays,
      maxDays,
      months,
      pagedNavigation,
      month,
      defaultMonth,
      onMonthChange: turn,
      defaultFocusedValue,
      locale,
      calendarSystem,
      min,
      max,
      isDateUnavailable,
      disabled,
      readOnly,
      fixedWeeks,
      name,
      form,
      onValueChange: change,
    }))
  )
</script>

<Part of={made.root} tag="div" {...rest} />
