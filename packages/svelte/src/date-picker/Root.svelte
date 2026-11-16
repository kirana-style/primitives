<script lang="ts">
  import { within } from "@kirana-ui/core"
  import type { ChangeDetails } from "@kirana-ui/core"
  import { createDatePicker } from "@kirana-ui/core/date-picker"
  import type { DatePickerProps } from "@kirana-ui/core/date-picker"
  import type { Snippet } from "svelte"

  import { provide as provideCalendar } from "../calendar/context.ts"
  import { provide as provideField } from "../date-field/context.ts"
  import { useDirectionAround } from "../direction/context.ts"
  import { provide as providePopover } from "../popover/context.ts"
  import { controller } from "../runtime.svelte.ts"
  import { provide } from "./context.ts"

  // A date field, and a calendar in a popover, with one value between them. It draws nothing.
  // `bind:value` is the day, `bind:open` whether the calendar shows.
  let {
    value = $bindable(),
    defaultValue,
    onValueChange,
    open = $bindable(),
    defaultOpen,
    onOpenChange,
    locale,
    min,
    max,
    isDateUnavailable,
    calendarSystem,
    fixedWeeks,
    placeholders,
    disabled,
    readOnly,
    required,
    name,
    form,
    id,
    children,
  }: Omit<DatePickerProps, "id"> & { id?: string; children?: Snippet } = $props()
  const generated = $props.id()

  function changeValue(next: string | null, by: ChangeDetails) {
    onValueChange?.(next, by)
    if (!by.canceled) value = next
  }

  function changeOpen(next: boolean, by: ChangeDetails) {
    onOpenChange?.(next, by)
    if (!by.canceled) open = next
  }

  const made = provide(
    controller(within(createDatePicker, { direction: useDirectionAround() }), () => ({
      id: id ?? generated,
      value,
      defaultValue,
      open,
      defaultOpen,
      locale,
      min,
      max,
      isDateUnavailable,
      calendarSystem,
      fixedWeeks,
      placeholders,
      disabled,
      readOnly,
      required,
      name,
      form,
      onValueChange: changeValue,
      onOpenChange: changeOpen,
    }))
  )
  provideField(made.field)
  providePopover(made.popover)
  provideCalendar(made.calendar)
</script>

{@render children?.()}
