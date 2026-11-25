import {
  Directive,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDatePicker } from "@kirana-ui/core/date-picker"
import type {
  DatePicker,
  DatePickerMode,
  DatePickerProps,
  DatePickerRange,
  DatePickerValue,
  DatePickerValueOf,
} from "@kirana-ui/core/date-picker"

import { KpCalendar } from "./calendar"
import { KpDateField } from "./date-field"
import { KP_DIRECTION } from "./direction-token"
import { KpPopover } from "./popover"
import { KpIds, hostPart, inputsSignal, mounted } from "./runtime"

/** What a date field's, a popover's or a calendar's directives find as their root. */
const stands = (pick: (picker: DatePicker) => unknown) => ({
  useFactory: (root: KpDatePicker) => ({
    get controller() {
      return pick(root.controller)
    },
  }),
  deps: [forwardRef(() => KpDatePicker)],
})

/**
 * A date field, and a calendar in a popover, with one value between them. On any element, or
 * on `<ng-container>` to draw none. Inside it the date field's, the popover's and the
 * calendar's own directives are its parts (`kpDateFieldSegments`, `kpPopoverTrigger`,
 * `kpCalendarGrid` …), with `kpDatePickerField` and `kpDatePickerCalendar` for the two
 * elements that hold them, and `kpDatePickerClear` and `kpDatePickerPreset` buttons.
 * `[(value)]` is the day (with `mode="range"` the range), `[(open)]` whether the calendar
 * shows, `[(month)]` the first day of the month it shows.
 */
@Directive({
  selector: "[kpDatePicker]",
  exportAs: "kpDatePicker",
  providers: [
    { provide: KpDateField, ...stands((picker) => picker.field) },
    { provide: KpPopover, ...stands((picker) => picker.popover) },
    { provide: KpCalendar, ...stands((picker) => picker.calendar) },
  ],
})
export class KpDatePicker<Mode extends DatePickerMode = DatePickerMode> implements OnInit {
  /** The day; with `mode="range"` a first and a last: `[(value)]`. Typed by `mode`. */
  readonly value = model<DatePickerValueOf<Mode> | undefined>(undefined)
  readonly defaultValue = input<NoInfer<DatePickerValueOf<Mode>>>()
  /**
   * One day (the default), or a first and a last (`"range"`): two `kpDatePickerField`s,
   * `range="start"` and `range="end"`. Read once.
   */
  readonly mode = input<Mode>()
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly locale = input<string>()
  readonly min = input<string>()
  readonly max = input<string>()
  readonly isDateUnavailable = input<DatePickerProps["isDateUnavailable"]>()
  readonly calendarSystem = input<DatePickerProps["calendarSystem"]>()
  readonly fixedWeeks = input(false, { transform: booleanAttribute })
  /** How many months the calendar shows side by side. */
  readonly months = input<number>()
  /** With several `months`: Previous and Next turn them all rather than one month. */
  readonly pagedNavigation = input(false, { transform: booleanAttribute })
  /** The first day of the month the calendar shows (any day of it): `[(month)]`. */
  readonly month = model<string | undefined>(undefined)
  /** The month the calendar starts on, when the caller does not hold `month`. Read once. */
  readonly defaultMonth = input<string>()
  readonly placeholders = input<DatePickerProps["placeholders"]>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form it belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kpId = input<string>()
  readonly valueChanged = output<{ value: DatePickerValueOf<Mode>; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()
  /** The calendar is about to show another month: its first day, and `details.cancel()`. */
  readonly monthChanged = output<{ month: string; details: ChangeDetails }>()

  controller!: DatePicker
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    // The core holds either mode's value; the caller's is its mode's.
    value: this.value() as DatePickerValue | undefined,
    defaultValue: this.defaultValue() as DatePickerValue | undefined,
    mode: this.mode(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    locale: this.locale(),
    min: this.min(),
    max: this.max(),
    isDateUnavailable: this.isDateUnavailable(),
    calendarSystem: this.calendarSystem(),
    fixedWeeks: this.fixedWeeks(),
    months: this.months(),
    pagedNavigation: this.pagedNavigation(),
    month: this.month(),
    defaultMonth: this.defaultMonth(),
    placeholders: this.placeholders(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (given: DatePickerValue, details: ChangeDetails) => {
      const value = given as DatePickerValueOf<Mode>
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) {
        this.open.set(open)
        this.props.sync()
      }
    },
    onMonthChange: (month: string, details: ChangeDetails) => {
      this.monthChanged.emit({ month, details })
      if (!details.canceled && this.month() !== undefined) {
        this.month.set(month)
        this.props.sync()
      }
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createDatePicker(this.props(), { direction: this.around?.direction })
    this.mount(this.controller)
  }
}

/**
 * The typed date: what holds its segments and its hidden input. With `mode="range"` there are
 * two, `range="start"` and `range="end"`, each giving the date field's directives inside it
 * their field.
 */
@Directive({
  selector: "[kpDatePickerField]",
  providers: [
    {
      provide: KpDateField,
      useFactory: (field: KpDatePickerField) => ({
        get controller() {
          return field.field
        },
      }),
      deps: [forwardRef(() => KpDatePickerField)],
    },
  ],
})
export class KpDatePickerField implements OnInit {
  /**
   * With `mode="range"`: which day of the range it is typed in, the first (`"start"`, the
   * default) or the last (`"end"`).
   */
  readonly range = input<"start" | "end">()
  private readonly root = inject(KpDatePicker)
  private readonly put = hostPart()

  /** The field it is: its end's, in a range. */
  get field() {
    const picker = this.root.controller
    return (this.range() === "end" && picker.endField) || picker.field
  }

  ngOnInit(): void {
    this.put(this.field.root)
  }
}

/** Empties the value, and gives focus to the field. Disabled while there is none. */
@Directive({ selector: "[kpDatePickerClear]" })
export class KpDatePickerClear implements OnInit {
  private readonly root = inject(KpDatePicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.clear)
  }
}

/** `<button kpDatePickerPreset [value]="…">`: makes the value the one it is given, pressed while it is. */
@Directive({ selector: "[kpDatePickerPreset]" })
export class KpDatePickerPreset implements OnInit {
  /** The value its press gives: a day, or with `mode="range"` a range. */
  readonly value = input.required<string | DatePickerRange>()
  private readonly root = inject(KpDatePicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.preset(this.value()))
  }
}

/** The calendar: what holds its heading, its buttons and its grid. */
@Directive({ selector: "[kpDatePickerCalendar]" })
export class KpDatePickerCalendar implements OnInit {
  private readonly root = inject(KpDatePicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.calendar.root)
  }
}
