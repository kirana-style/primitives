import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails, ReadonlySignal } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar,
  CalendarDay,
  CalendarMode,
  CalendarMonth,
  CalendarProps,
  CalendarValue,
  CalendarValueOf,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, drawing, hostPart, inputsSignal, onServer, ownText } from "./runtime"

/** The place of the month the parts inside are drawn in: `*kpCalendarMonths` gives it. */
const KP_CALENDAR_MONTH = new InjectionToken<number>("KpCalendarMonth")

@Directive({ selector: "[kpCalendar]", exportAs: "kpCalendar" })
export class KpCalendar<Mode extends CalendarMode = CalendarMode> implements OnInit {
  /**
   * One day; with `mode="range"` a first and a last; with `mode="multiple"` a list: `[(value)]`.
   * Typed by `mode`.
   */
  readonly value = model<CalendarValueOf<Mode> | undefined>(undefined)
  readonly defaultValue = input<NoInfer<CalendarValueOf<Mode>>>()
  /** One day (the default), a first and a last (`"range"`), or any number (`"multiple"`). */
  readonly mode = input<Mode>()
  /**
   * A chosen day stays chosen: pressed again it is kept, and with `mode="multiple"` the last day
   * cannot be taken away. Without it, a second press on the chosen day empties the value.
   */
  readonly required = input(false, { transform: booleanAttribute })
  /** With `mode="multiple"`: the fewest days that can be left chosen. */
  readonly minDays = input<number>()
  /** With `mode="multiple"`: the most days that can be chosen. */
  readonly maxDays = input<number>()
  /** How many months are shown side by side, each drawn by `*kpCalendarMonths`. */
  readonly months = input<number>()
  /** With several `months`: Previous and Next turn them all rather than one month. */
  readonly pagedNavigation = input(false, { transform: booleanAttribute })
  /** The first day of the month shown (any day of it): `[(month)]`. */
  readonly month = model<string | undefined>(undefined)
  /** The month it starts on, when the caller does not hold `month`. Read once. */
  readonly defaultMonth = input<string>()
  readonly defaultFocusedValue = input<string>()
  /**
   * The language and region its names, first day of the week and calendar follow. The week
   * begins where the region begins it, or on the day a `-u-fw-` extension names
   * (`"en-US-u-fw-mon"`).
   */
  readonly locale = input<string>()
  /** The calendar its months are laid out in, when it is not the Gregorian one. */
  readonly calendarSystem = input<CalendarProps["calendarSystem"]>()
  readonly min = input<string>()
  readonly max = input<string>()
  readonly isDateUnavailable = input<(date: string) => boolean>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly fixedWeeks = input(false, { transform: booleanAttribute })
  /** The name its hidden input (`kpCalendarInput`) submits the value under. */
  readonly name = input<string>()
  /** The id of the form it belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kpId = input<string>()
  readonly valueChanged = output<{ value: CalendarValueOf<Mode>; details: ChangeDetails }>()
  /** Another month is about to be shown: its first day, and `details.cancel()`. */
  readonly monthChanged = output<{ month: string; details: ChangeDetails }>()

  controller!: Calendar
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    // The core holds any mode's value; the caller's is its mode's.
    value: this.value() as CalendarValue | undefined,
    defaultValue: this.defaultValue() as CalendarValue | undefined,
    mode: this.mode(),
    required: this.required(),
    minDays: this.minDays(),
    maxDays: this.maxDays(),
    months: this.months(),
    pagedNavigation: this.pagedNavigation(),
    month: this.month(),
    defaultMonth: this.defaultMonth(),
    defaultFocusedValue: this.defaultFocusedValue(),
    locale: this.locale(),
    calendarSystem: this.calendarSystem(),
    min: this.min(),
    max: this.max(),
    isDateUnavailable: this.isDateUnavailable(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    fixedWeeks: this.fixedWeeks(),
    name: this.name(),
    form: this.form(),
    onValueChange: (given: CalendarValue, details: ChangeDetails) => {
      const value = given as CalendarValueOf<Mode>
      this.valueChanged.emit({ value, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.value() !== undefined) {
        this.value.set(value)
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
    this.controller = createCalendar(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
  }
}

function part(name: "previous" | "next" | "grid" | "input") {
  const root = inject(KpCalendar)
  const index = inject(KP_CALENDAR_MONTH, { optional: true }) ?? 0
  const put = hostPart()
  return () => put(name === "grid" ? root.controller.monthAt(index).grid : root.controller[name])
}

/** The place of the month a part is drawn in, inside `*kpCalendarMonths`. */
const monthIndex = () => inject(KP_CALENDAR_MONTH, { optional: true }) ?? undefined

/**
 * Names the month shown, unless the element has content of its own: then that is what it says,
 * and the live region reads it as the month changes.
 */
@Directive({ selector: "[kpCalendarHeading]" })
export class KpCalendarHeading implements OnInit {
  private readonly root = inject(KpCalendar)
  private readonly index = monthIndex() ?? 0
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly put = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    const month = this.root.controller.monthAt(this.index)
    this.put(month.heading)
    const text = ownText(this.element, this.server)
    if (!text) return
    const title = month.title
    text.data = title.peek()
    if (this.server) return
    this.destroy.onDestroy(
      effect(() => {
        text.data = title.get()
      })
    )
  }
}

@Directive({ selector: "[kpCalendarPrevious]" })
export class KpCalendarPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpCalendarNext]" })
export class KpCalendarNext implements OnInit {
  private readonly init = part("next")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpCalendarGrid]" })
export class KpCalendarGrid implements OnInit {
  private readonly init = part("grid")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * A template once for each of a list's items, kept by a key: drawn on a server too. `within`
 * gives what an item's view provides to the directives inside it.
 */
function each<T>(
  key: (item: T) => string | number,
  within?: (item: T, parent: Injector) => Injector
): (items: ReadonlySignal<readonly T[]>) => void {
  const template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef)
  const container = inject(ViewContainerRef)
  const parent = inject(Injector)
  const destroy = inject(DestroyRef)
  const server = onServer()
  const views = new Map<string | number, EmbeddedViewRef<{ $implicit: T }>>()
  const draw = (items: readonly T[]) => {
    const keys = new Set(items.map(key))
    for (const [id, view] of views) {
      if (keys.has(id)) continue
      view.destroy()
      views.delete(id)
    }
    items.forEach((item, at) => {
      const id = key(item)
      let view = views.get(id)
      if (!view) {
        view = container.createEmbeddedView(
          template,
          { $implicit: item },
          { index: at, injector: within?.(item, parent) }
        )
        views.set(id, view)
      } else {
        view.context.$implicit = item
        if (container.indexOf(view) !== at) container.move(view, at)
        view.markForCheck()
      }
      view.detectChanges()
    })
  }
  return (items) => {
    if (server) return draw(items.peek())
    destroy.onDestroy(
      effect(() => {
        const now = items.get()
        drawing(() => draw(now))
      })
    )
  }
}

/** `<th *kpCalendarWeekdays="let weekday">`: once for each day of the week. */
@Directive({ selector: "[kpCalendarWeekdays]" })
export class KpCalendarWeekdays implements OnInit {
  private readonly root = inject(KpCalendar)
  private readonly draw = each<CalendarWeekday>((weekday) => weekday.index)

  ngOnInit(): void {
    this.draw(this.root.controller.weekdays)
  }

  static ngTemplateContextGuard(
    _directive: KpCalendarWeekdays,
    _context: unknown
  ): _context is { $implicit: CalendarWeekday } {
    return true
  }
}

/**
 * `<div *kpCalendarMonths="let month">`: once for each month shown, side by side. The parts
 * inside each are that month's. Left out for one month.
 */
@Directive({ selector: "[kpCalendarMonths]" })
export class KpCalendarMonths implements OnInit {
  private readonly root = inject(KpCalendar)
  private readonly draw = each<CalendarMonth>(
    (month) => month.index,
    (month, parent) =>
      Injector.create({
        providers: [{ provide: KP_CALENDAR_MONTH, useValue: month.index }],
        parent,
      })
  )

  ngOnInit(): void {
    this.draw(this.root.controller.months)
  }

  static ngTemplateContextGuard(
    _directive: KpCalendarMonths,
    _context: unknown
  ): _context is { $implicit: CalendarMonth } {
    return true
  }
}

/** `<tr *kpCalendarWeeks="let week">`: once for each week of the month shown. */
@Directive({ selector: "[kpCalendarWeeks]" })
export class KpCalendarWeeks implements OnInit {
  private readonly root = inject(KpCalendar)
  private readonly index = monthIndex() ?? 0
  private readonly draw = each<readonly CalendarDay[]>((week) => week[0]!.date)

  ngOnInit(): void {
    this.draw(this.root.controller.monthAt(this.index).weeks)
  }

  static ngTemplateContextGuard(
    _directive: KpCalendarWeeks,
    _context: unknown
  ): _context is { $implicit: readonly CalendarDay[] } {
    return true
  }
}

@Directive({ selector: "[kpCalendarHeadCell]" })
export class KpCalendarHeadCell implements OnInit {
  readonly weekday = input.required<CalendarWeekday>()
  private readonly root = inject(KpCalendar)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.headCell(this.weekday()))
  }
}

@Directive({ selector: "[kpCalendarCell]" })
export class KpCalendarCell implements OnInit {
  readonly date = input.required<string>()
  private readonly root = inject(KpCalendar)
  private readonly index = monthIndex()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.cell(this.date(), this.index))
  }
}

@Directive({ selector: "[kpCalendarDay]" })
export class KpCalendarDay implements OnInit {
  readonly date = input.required<string>()
  private readonly root = inject(KpCalendar)
  private readonly index = monthIndex()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.day(this.date(), this.index))
  }
}

/** `<input kpCalendarInput>`: the hidden input the value is submitted by, with a `name`. */
@Directive({ selector: "input[kpCalendarInput]" })
export class KpCalendarInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}
