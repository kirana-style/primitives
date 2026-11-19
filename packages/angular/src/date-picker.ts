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
import type { DatePicker, DatePickerProps } from "@kirana-ui/core/date-picker"

import { KuiCalendar } from "./calendar"
import { KuiDateField } from "./date-field"
import { KUI_DIRECTION } from "./direction-token"
import { KuiPopover } from "./popover"
import { KuiIds, hostPart, inputsSignal, mounted } from "./runtime"

/** What a date field's, a popover's or a calendar's directives find as their root. */
const stands = (pick: (picker: DatePicker) => unknown) => ({
  useFactory: (root: KuiDatePicker) => ({
    get controller() {
      return pick(root.controller)
    },
  }),
  deps: [forwardRef(() => KuiDatePicker)],
})

/**
 * A date field, and a calendar in a popover, with one value between them. On any element, or
 * on `<ng-container>` to draw none. Inside it the date field's, the popover's and the
 * calendar's own directives are its parts (`kuiDateFieldSegments`, `kuiPopoverTrigger`,
 * `kuiCalendarGrid` …), with `kuiDatePickerField` and `kuiDatePickerCalendar` for the two
 * elements that hold them. `[(value)]` is the day, `[(open)]` whether the calendar shows,
 * `[(month)]` the first day of the month it shows.
 */
@Directive({
  selector: "[kuiDatePicker]",
  exportAs: "kuiDatePicker",
  providers: [
    { provide: KuiDateField, ...stands((picker) => picker.field) },
    { provide: KuiPopover, ...stands((picker) => picker.popover) },
    { provide: KuiCalendar, ...stands((picker) => picker.calendar) },
  ],
})
export class KuiDatePicker implements OnInit {
  readonly value = model<string | null | undefined>(undefined)
  readonly defaultValue = input<string | null>()
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
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: string | null; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()
  /** The calendar is about to show another month: its first day, and `details.cancel()`. */
  readonly monthChanged = output<{ month: string; details: ChangeDetails }>()

  controller!: DatePicker
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
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
    onValueChange: (value: string | null, details: ChangeDetails) => {
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

/** The typed date: what holds its segments and its hidden input. */
@Directive({ selector: "[kuiDatePickerField]" })
export class KuiDatePickerField implements OnInit {
  private readonly root = inject(KuiDatePicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.field.root)
  }
}

/** The calendar: what holds its heading, its buttons and its grid. */
@Directive({ selector: "[kuiDatePickerCalendar]" })
export class KuiDatePickerCalendar implements OnInit {
  private readonly root = inject(KuiDatePicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.calendar.root)
  }
}
