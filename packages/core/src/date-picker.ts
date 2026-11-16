import { bindable } from "./bindable.ts"
import { createCalendar } from "./calendar.ts"
import type { Calendar, CalendarProps } from "./calendar.ts"
import { createDateField } from "./date-field.ts"
import type { DateField, DateFieldProps, IsoDate } from "./date-field.ts"
import type { DirectionAround } from "./direction.ts"
import { details } from "./part.ts"
import type { ChangeDetails } from "./part.ts"
import { createPopover } from "./popover.ts"
import type { Popover } from "./popover.ts"
import { computed, effect, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface DatePickerProps {
  id: string
  /** The day, typed or picked; `null` for none. */
  value?: IsoDate | null | undefined
  defaultValue?: IsoDate | null | undefined
  onValueChange?: ((value: IsoDate | null, details: ChangeDetails) => void) | undefined
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** The language and region of the field and the calendar. Give it: a server does not know. */
  locale?: string | undefined
  /** The first and the last day that can be typed or picked. */
  min?: IsoDate | undefined
  max?: IsoDate | undefined
  /** Days that cannot be picked in the calendar. */
  isDateUnavailable?: CalendarProps["isDateUnavailable"]
  /** The calendar its months are laid out in, when it is not the Gregorian one. */
  calendarSystem?: CalendarProps["calendarSystem"]
  /** Always six rows of days. */
  fixedWeeks?: boolean | undefined
  /** What an empty part of the field shows. */
  placeholders?: DateFieldProps["placeholders"]
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  required?: boolean | undefined
  /** The name it is submitted under. */
  name?: string | undefined
  /** The id of the form it belongs to, when it is not inside it. */
  form?: string | undefined
}

export interface DatePicker {
  readonly value: ReadonlySignal<IsoDate | null>
  readonly open: ReadonlySignal<boolean>
  /** The typed date: its parts are a date field's. */
  readonly field: DateField
  /** What the calendar opens in: its parts are a popover's. */
  readonly popover: Popover
  /** Its parts are a calendar's. */
  readonly calendar: Calendar
  mount(): () => void
}

/**
 * A day that is typed or picked: a date field, and a calendar in a popover its button opens.
 * The three are the components they are, with one value between them: a day typed is the
 * calendar's, and a day picked is written into the field and closes the calendar.
 */
export function createDatePicker(
  props: ReadonlySignal<DatePickerProps>,
  around: DirectionAround = {}
): DatePicker {
  const id = props.peek().id
  const value = bindable<IsoDate | null>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
  })
  const popover = createPopover(
    computed(() => ({
      id,
      open: props.get().open,
      defaultOpen: props.peek().defaultOpen,
      onOpenChange: (next: boolean, by: ChangeDetails) => {
        // Nothing to pick while it cannot be changed.
        if (next && (props.peek().disabled || props.peek().readOnly)) return by.cancel()
        props.peek().onOpenChange?.(next, by)
      },
    }))
  )
  const field = createDateField(
    computed<DateFieldProps>(() => {
      const own = props.get()
      return {
        id: `${id}-field`,
        value: value.get(),
        onValueChange: (next, by) => value.set(next, by),
        locale: own.locale,
        min: own.min,
        max: own.max,
        placeholders: own.placeholders,
        disabled: own.disabled,
        readOnly: own.readOnly,
        required: own.required,
        name: own.name,
        form: own.form,
      }
    }),
    around
  )
  const calendar = createCalendar(
    computed<CalendarProps>(() => {
      const own = props.get()
      return {
        id: `${id}-calendar`,
        value: value.get(),
        onValueChange(next, by) {
          value.set(typeof next === "string" ? next : null, by)
          // Picked, it is done: the calendar closes, and focus goes back to its button.
          if (!by.canceled) popover.setOpen(false, details("day-press", by.event))
        },
        locale: own.locale,
        calendarSystem: own.calendarSystem,
        min: own.min,
        max: own.max,
        isDateUnavailable: own.isDateUnavailable,
        fixedWeeks: own.fixedWeeks,
        disabled: own.disabled,
        readOnly: own.readOnly,
      }
    }),
    around
  )
  return {
    value,
    open: popover.open,
    field,
    popover,
    calendar,
    mount() {
      const stops = [
        field.mount(),
        popover.mount(),
        calendar.mount(),
        // The calendar shows the month of the day there is, however it came to be.
        effect(() => {
          const day = value.get()
          if (day) untracked(() => calendar.goTo(day))
        }),
      ]
      return () => {
        for (const stop of stops.reverse()) stop()
      }
    },
  }
}
