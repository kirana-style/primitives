import { bindable } from "./bindable.ts"
import { createCalendar } from "./calendar.ts"
import type { Calendar, CalendarProps, DateRange } from "./calendar.ts"
import { createDateField } from "./date-field.ts"
import type { DateField, DateFieldProps, IsoDate } from "./date-field.ts"
import type { DirectionAround } from "./direction.ts"
import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { createPopover } from "./popover.ts"
import type { Popover } from "./popover.ts"
import { computed, effect, untracked } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

/** Whether a date picker chooses one day or a first and a last. */
export type DatePickerMode = "single" | "range"
/**
 * A range a date picker holds: its first and its last day, either `null` while it is being
 * chosen (the first picked, the second not yet; one end typed).
 */
export interface DatePickerRange {
  start: IsoDate | null
  end: IsoDate | null
}
/** What a date picker holds: a day, or in `mode: "range"` a range; `null` for none. */
export type DatePickerValue = IsoDate | DatePickerRange | null
/** The value of one mode: a day or `null`, or a range or `null`. */
export type DatePickerValueOf<Mode extends DatePickerMode | undefined> = Mode extends "range"
  ? DatePickerRange | null
  : IsoDate | null

export interface DatePickerProps<Mode extends DatePickerMode = DatePickerMode> {
  id: string
  /**
   * The day, typed or picked; with `mode: "range"` a first and a last day, each typed in its own
   * field or both picked in the one calendar. `null` for none.
   */
  value?: DatePickerValueOf<Mode> | undefined
  /** The value it starts with, when the caller does not hold `value`. Read once. */
  defaultValue?: DatePickerValueOf<Mode> | undefined
  /**
   * Heard as the value is about to change, typed, picked, pressed or cleared: `details.cancel()`
   * keeps the value as it was. A range is heard as each end comes, its other end `null` until
   * it is there too.
   */
  onValueChange?: ((value: DatePickerValueOf<Mode>, details: ChangeDetails) => void) | undefined
  /**
   * One day (the default), or a first and a last (`"range"`): two fields, `DatePicker.Field`
   * with `range="start"` and `range="end"`, and the calendar in range mode, which stays open
   * until the range is whole. Read once.
   */
  mode?: Mode | undefined
  /** Whether the calendar is open, when the caller holds it. */
  open?: boolean | undefined
  /** Whether the calendar starts open, when the caller does not hold `open`. Read once. */
  defaultOpen?: boolean | undefined
  /** Heard as the calendar is about to open or close: `details.cancel()` keeps it as it was. */
  onOpenChange?: ((open: boolean, details: ChangeDetails) => void) | undefined
  /** The language and region of the field and the calendar. Give it: a server does not know. */
  locale?: string | undefined
  /** The first and the last day that can be typed or picked. */
  min?: IsoDate | undefined
  /** The last day that can be typed or picked. */
  max?: IsoDate | undefined
  /** Days that cannot be picked in the calendar. */
  isDateUnavailable?: CalendarProps["isDateUnavailable"]
  /**
   * The calendar its months are laid out in and its field typed in, when it is not the
   * Gregorian one. The value is an ISO day whatever it is.
   */
  calendarSystem?: CalendarProps["calendarSystem"]
  /** Always six rows of days. */
  fixedWeeks?: boolean | undefined
  /** How many months the calendar shows side by side (1 by default). */
  months?: CalendarProps["months"]
  /** With several `months`: whether Previous and Next turn them all rather than one month. */
  pagedNavigation?: boolean | undefined
  /** The month the calendar shows (the first, with several), when the caller holds it. */
  month?: IsoDate | undefined
  /** The month the calendar starts on, when the caller does not hold `month`. Read once. */
  defaultMonth?: IsoDate | undefined
  /**
   * Heard as the calendar is about to show another month, a day typed or picked included: its
   * first day. `details.cancel()` keeps the month as it was.
   */
  onMonthChange?: CalendarProps["onMonthChange"]
  /** What an empty part of the field shows. */
  placeholders?: DateFieldProps["placeholders"]
  /** Disabled: it cannot be changed. */
  disabled?: boolean | undefined
  /** Shown as it is, focusable, not changeable. */
  readOnly?: boolean | undefined
  /**
   * Needed: in a `Field`, leaving it empty is then invalid, and the day picked, pressed again in
   * the calendar, stays picked. Without it, that press empties the field and closes the calendar.
   */
  required?: boolean | undefined
  /** The name it is submitted under. */
  name?: string | undefined
  /** The id of the form it belongs to, when it is not inside it. */
  form?: string | undefined
}

export interface DatePicker {
  readonly value: ReadonlySignal<DatePickerValue>
  readonly mode: DatePickerMode
  readonly open: ReadonlySignal<boolean>
  /** The typed date: its parts are a date field's. In `mode: "range"`, the first day's. */
  readonly field: DateField
  /** In `mode: "range"`, the field the last day is typed in; else none. */
  readonly endField: DateField | undefined
  /** What the calendar opens in: its parts are a popover's. */
  readonly popover: Popover
  /** Its parts are a calendar's. */
  readonly calendar: Calendar
  /** A button that empties the value: disabled while there is none. Focus goes to the field. */
  readonly clear: Part
  /**
   * A button whose press makes the value the one it is given (a day, or a range in
   * `mode: "range"`): pressed (`aria-pressed`) while the value is that.
   */
  preset(value: IsoDate | DatePickerRange): Part
  mount(): () => void
}

const NONE = () => () => {}
const sameRange = (a: DatePickerRange, b: DatePickerRange) => a.start === b.start && a.end === b.end
const same = (a: DatePickerValue, b: DatePickerValue): boolean =>
  a === b ||
  (a !== null && b !== null && typeof a === "object" && typeof b === "object" && sameRange(a, b))

/**
 * A day that is typed or picked: a date field, and a calendar in a popover its button opens.
 * The three are the components they are, with one value between them: a day typed is the
 * calendar's, and a day picked is written into the field and closes the calendar.
 *
 * In `mode: "range"` there are two fields, the first day's and the last's, and the calendar
 * chooses both: its first press is the first day (the last emptied), its second the other, and
 * only then does it close. An end typed is the calendar's too; one typed before the start, or
 * after the end, says it is invalid.
 */
export function createDatePicker(
  props: ReadonlySignal<DatePickerProps>,
  around: DirectionAround = {}
): DatePicker {
  const id = props.peek().id
  const mode: DatePickerMode = props.peek().mode === "range" ? "range" : "single"
  const range = mode === "range"
  const value = bindable<DatePickerValue>({
    value: () => props.get().value,
    defaultValue: props.peek().defaultValue ?? null,
    onChange: (next, by) => props.peek().onValueChange?.(next, by),
    equals: same,
  })
  // A range's two ends; a day is the first.
  const ends = computed((): DatePickerRange => {
    const now = value.get()
    if (now === null || typeof now === "string") return { start: now, end: null }
    return { start: now.start ?? null, end: now.end ?? null }
  }, sameRange)
  /** A range from its ends: none when both are empty. */
  const setEnds = (start: IsoDate | null, end: IsoDate | null, by: ChangeDetails) =>
    value.set(start === null && end === null ? null : { start, end }, by)
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
  const fieldFor = (end: boolean) =>
    createDateField(
      computed<DateFieldProps>(() => {
        const own = props.get()
        const { start, end: last } = ends.get()
        return {
          id: end ? `${id}-field-end` : `${id}-field`,
          value: end ? last : start,
          onValueChange(next, by) {
            if (!range) return value.set(next, by)
            const now = ends.peek()
            setEnds(end ? now.start : next, end ? next : now.end, by)
          },
          locale: own.locale,
          calendarSystem: own.calendarSystem,
          // Each end of a range is held inside the other: one typed past it is invalid.
          min:
            end && start !== null && (own.min === undefined || start > own.min) ? start : own.min,
          max:
            range && !end && last !== null && (own.max === undefined || last < own.max)
              ? last
              : own.max,
          placeholders: own.placeholders,
          disabled: own.disabled,
          readOnly: own.readOnly,
          required: own.required,
          // A range sends its first and its last day under the one name, as two entries.
          name: own.name,
          form: own.form,
        }
      }),
      around
    )
  const field = fieldFor(false)
  const endField = range ? fieldFor(true) : undefined
  const calendar = createCalendar(
    computed<CalendarProps>(() => {
      const own = props.get()
      const { start, end } = ends.get()
      return {
        id: `${id}-calendar`,
        mode: range ? "range" : undefined,
        // A range the calendar shows is whole and in order; one end alone is a range begun.
        value: range
          ? start !== null && end !== null && start <= end
            ? { start, end }
            : null
          : start,
        onValueChange(next, by) {
          if (range) {
            const chosen = next as DateRange | null
            setEnds(chosen?.start ?? null, chosen?.end ?? null, by)
          } else value.set(typeof next === "string" ? next : null, by)
          // Picked, it is done: the calendar closes, and focus goes back to its button. A range
          // is told only once its second day is pressed.
          if (!by.canceled) popover.setOpen(false, details("day-press", by.event))
        },
        locale: own.locale,
        calendarSystem: own.calendarSystem,
        min: own.min,
        max: own.max,
        isDateUnavailable: own.isDateUnavailable,
        fixedWeeks: own.fixedWeeks,
        months: own.months,
        pagedNavigation: own.pagedNavigation,
        month: own.month,
        defaultMonth: own.defaultMonth,
        onMonthChange: (next, by) => props.peek().onMonthChange?.(next, by),
        disabled: own.disabled,
        readOnly: own.readOnly,
        required: own.required,
      }
    }),
    {
      ...around,
      range: range
        ? {
            // One end alone, typed or picked, is a range begun: the next press is the other.
            anchor: computed(() => {
              const { start, end } = ends.get()
              return start === null ? (end ?? undefined) : end === null ? start : undefined
            }),
            begin: (date, by) => setEnds(date, null, by),
          }
        : undefined,
    }
  )
  const off = () => Boolean(props.get().disabled) || Boolean(props.get().readOnly)
  // The day the calendar shows the month of: the value's, or a range's first.
  const shownDay = computed(() => ends.get().start ?? ends.get().end)
  const presets = new Map<string, Part>()

  return {
    value,
    mode,
    open: popover.open,
    field,
    endField,
    popover,
    calendar,
    clear: {
      props: computed(() => {
        const none = value.get() === null || off()
        return {
          type: "button",
          disabled: none ? "" : undefined,
          "data-disabled": flag(none),
          onClick(event: Event) {
            const by = details("clear-press", event)
            value.set(null, by)
            if (!by.canceled) field.focus()
          },
        }
      }),
      attach: NONE,
    },
    preset(given) {
      const key = typeof given === "string" ? given : `${given.start}/${given.end}`
      let made = presets.get(key)
      if (!made) {
        made = {
          props: computed(() => {
            const current = same(value.get(), given)
            return {
              type: "button",
              "aria-pressed": String(current),
              "data-pressed": flag(current),
              disabled: off() ? "" : undefined,
              "data-disabled": flag(off()),
              onClick: (event: Event) => value.set(given, details("preset-press", event)),
            }
          }),
          attach: NONE,
        }
        presets.set(key, made)
      }
      return made
    },
    mount() {
      const stops = [
        field.mount(),
        endField?.mount() ?? (() => {}),
        popover.mount(),
        calendar.mount(),
        // The calendar shows the month of the day there is, however it came to be.
        effect(() => {
          const day = shownDay.get()
          if (day) untracked(() => calendar.goTo(day))
        }),
      ]
      return () => {
        for (const stop of stops.reverse()) stop()
      }
    },
  }
}
