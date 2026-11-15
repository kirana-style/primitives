import {
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails, ReadonlySignal } from "@kirana-ui/core"
import { createCalendar } from "@kirana-ui/core/calendar"
import type {
  Calendar,
  CalendarDay,
  CalendarProps,
  CalendarValue,
  CalendarWeekday,
} from "@kirana-ui/core/calendar"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal, onServer } from "./runtime"

@Directive({ selector: "[kuiCalendar]", exportAs: "kuiCalendar" })
export class KuiCalendar implements OnInit {
  /** One day, or with `mode="range"` a first and a last: `[(value)]`. */
  readonly value = model<CalendarValue | undefined>(undefined)
  readonly defaultValue = input<CalendarValue>()
  readonly mode = input<"single" | "range">()
  readonly defaultFocusedValue = input<string>()
  /** The language and region its names, first day of the week and calendar follow. */
  readonly locale = input<string>()
  /** The calendar its months are laid out in, when it is not the Gregorian one. */
  readonly calendarSystem = input<CalendarProps["calendarSystem"]>()
  readonly min = input<string>()
  readonly max = input<string>()
  readonly isDateUnavailable = input<(date: string) => boolean>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly fixedWeeks = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: CalendarValue; details: ChangeDetails }>()
  /** Another month is shown: its first day. */
  readonly monthChanged = output<string>()

  controller!: Calendar
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    mode: this.mode(),
    defaultFocusedValue: this.defaultFocusedValue(),
    locale: this.locale(),
    calendarSystem: this.calendarSystem(),
    min: this.min(),
    max: this.max(),
    isDateUnavailable: this.isDateUnavailable(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    fixedWeeks: this.fixedWeeks(),
    onValueChange: (value: CalendarValue, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.value() !== undefined) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onMonthChange: (month: string) => this.monthChanged.emit(month),
  }))

  ngOnInit(): void {
    this.controller = createCalendar(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
  }
}

function part(name: "previous" | "next" | "grid") {
  const root = inject(KuiCalendar)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** Names the month shown: it writes the name before whatever is inside it. */
@Directive({ selector: "[kuiCalendarHeading]" })
export class KuiCalendarHeading implements OnInit {
  private readonly root = inject(KuiCalendar)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly put = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    this.put(this.root.controller.heading)
    const title = this.root.controller.title
    // The name a server wrote is the one kept: a second beside it would say the month twice.
    const written = this.element.firstChild
    const text =
      written?.nodeType === 3
        ? (written as Text)
        : this.element.insertBefore(
            this.element.ownerDocument.createTextNode(title.peek()),
            written
          )
    if (this.server) return
    this.destroy.onDestroy(
      effect(() => {
        text.data = title.get()
      })
    )
  }
}

@Directive({ selector: "[kuiCalendarPrevious]" })
export class KuiCalendarPrevious implements OnInit {
  private readonly init = part("previous")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiCalendarNext]" })
export class KuiCalendarNext implements OnInit {
  private readonly init = part("next")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiCalendarGrid]" })
export class KuiCalendarGrid implements OnInit {
  private readonly init = part("grid")

  ngOnInit(): void {
    this.init()
  }
}

/** A template once for each of a list's items, kept by a key: drawn on a server too. */
function each<T>(key: (item: T) => string | number): (items: ReadonlySignal<readonly T[]>) => void {
  const template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef)
  const container = inject(ViewContainerRef)
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
        view = container.createEmbeddedView(template, { $implicit: item }, at)
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
    destroy.onDestroy(effect(() => draw(items.get())))
  }
}

/** `<th *kuiCalendarWeekdays="let weekday">`: once for each day of the week. */
@Directive({ selector: "[kuiCalendarWeekdays]" })
export class KuiCalendarWeekdays implements OnInit {
  private readonly root = inject(KuiCalendar)
  private readonly draw = each<CalendarWeekday>((weekday) => weekday.index)

  ngOnInit(): void {
    this.draw(this.root.controller.weekdays)
  }
}

/** `<tr *kuiCalendarWeeks="let week">`: once for each week of the month shown. */
@Directive({ selector: "[kuiCalendarWeeks]" })
export class KuiCalendarWeeks implements OnInit {
  private readonly root = inject(KuiCalendar)
  private readonly draw = each<readonly CalendarDay[]>((week) => week[0]!.date)

  ngOnInit(): void {
    this.draw(this.root.controller.weeks)
  }
}

@Directive({ selector: "[kuiCalendarHeadCell]" })
export class KuiCalendarHeadCell implements OnInit {
  readonly weekday = input.required<CalendarWeekday>()
  private readonly root = inject(KuiCalendar)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.headCell(this.weekday()))
  }
}

@Directive({ selector: "[kuiCalendarCell]" })
export class KuiCalendarCell implements OnInit {
  readonly date = input.required<string>()
  private readonly root = inject(KuiCalendar)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.cell(this.date()))
  }
}

@Directive({ selector: "[kuiCalendarDay]" })
export class KuiCalendarDay implements OnInit {
  readonly date = input.required<string>()
  private readonly root = inject(KuiCalendar)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.day(this.date()))
  }
}
