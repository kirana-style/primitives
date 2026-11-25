<script lang="ts" generics="Mode extends DatePickerMode = 'single'">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createDatePicker } from "@kirana-ui/core/date-picker"
  import type {
    DatePickerMode,
    DatePickerValue,
    DatePickerValueOf,
  } from "@kirana-ui/core/date-picker"

  import { provide as provideCalendar } from "../calendar/context.ts"
  import { provide as provideField } from "../date-field/context.ts"
  import { useDirectionAround } from "../direction/context.ts"
  import { provide as providePopover } from "../popover/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"
  import type { RootProps } from "./types.ts"

  // A date field, and a calendar in a popover, with one value between them. It draws nothing.
  // `bind:value` is the day (or the range, with `mode="range"`), `bind:open` whether the calendar
  // shows, `bind:month` the first day of the month it shows.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    mode,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    locale,
    min,
    max,
    isDateUnavailable,
    calendarSystem,
    fixedWeeks,
    months,
    pagedNavigation,
    month = $bindable(),
    defaultMonth,
    onMonthChange,
    placeholders,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
    children,
  }: RootProps<Mode> = $props()
  const generated = $props.id()

  // The core holds either mode's value; the caller's is its mode's.
  function changeValue(next: DatePickerValue, by: ChangeDetails) {
    onValueChange?.(next as DatePickerValueOf<Mode>, by)
    if (!by.canceled) value = next as DatePickerValueOf<Mode>
  }

  function changeOpen(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  function changeMonth(next: string, by: ChangeDetails) {
    onMonthChange?.(next, by)
    if (!by.canceled && month !== undefined) month = next
  }

  const made = provide(
    controller(within(createDatePicker, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value: value as DatePickerValue | undefined,
      defaultValue: defaultValue as DatePickerValue | undefined,
      mode,
      open,
      defaultOpen,
      locale,
      min,
      max,
      isDateUnavailable,
      calendarSystem,
      fixedWeeks,
      months,
      pagedNavigation,
      month,
      defaultMonth,
      placeholders,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: changeValue,
      onOpenChange: changeOpen,
      onMonthChange: changeMonth,
    }))
  )
  provideField(made.field)
  providePopover(made.popover)
  provideCalendar(made.calendar)
</script>

{@render children?.()}
