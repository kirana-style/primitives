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
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createTimeField } from "@kirana-ui/core/time-field"
import type {
  HourCycle,
  TimeField,
  TimeFieldProps,
  TimeFieldSegment,
  TimeGranularity,
} from "@kirana-ui/core/time-field"

import { KP_DIRECTION } from "./direction-token"
import { KP_FIELD } from "./field-token"
import { KpIds, drawing, hostPart, inputsSignal, mounted, onServer } from "./runtime"

@Directive({ selector: "[kpTimeField]", exportAs: "kpTimeField" })
export class KpTimeField implements OnInit {
  /** The time typed, once all of it is: `[(value)]`. */
  readonly value = model<string | null | undefined>(undefined)
  readonly defaultValue = input<string | null>()
  /** To the minute (`HH:MM`, the default) or to the second (`HH:MM:SS`). */
  readonly granularity = input<TimeGranularity>()
  /** A clock of 12 or 24 hours, whatever the locale's is. */
  readonly hourCycle = input<HourCycle>()
  /** The language and region that order the parts and say how many hours the clock has. */
  readonly locale = input<string>()
  readonly min = input<string>()
  readonly max = input<string>()
  readonly placeholders = input<TimeFieldProps["placeholders"]>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form it belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kpId = input<string>()
  readonly valueChanged = output<{ value: string | null; details: ChangeDetails }>()

  controller!: TimeField
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    granularity: this.granularity(),
    hourCycle: this.hourCycle(),
    locale: this.locale(),
    min: this.min(),
    max: this.max(),
    placeholders: this.placeholders(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: string | null, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.value() !== undefined) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createTimeField(this.props(), {
      direction: this.around?.direction,
      field: this.field?.controller,
    })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

/** `<span *kpTimeFieldSegments="let segment">`: once for each piece of the time. */
@Directive({ selector: "[kpTimeFieldSegments]" })
export class KpTimeFieldSegments implements OnInit {
  private readonly root = inject(KpTimeField)
  private readonly template = inject<TemplateRef<{ $implicit: TimeFieldSegment }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private views: EmbeddedViewRef<{ $implicit: TimeFieldSegment }>[] = []

  ngOnInit(): void {
    const draw = (segments: readonly TimeFieldSegment[]) => {
      // The pieces change only with the locale, the clock or the granularity: drawn again whole.
      for (const view of this.views) view.destroy()
      this.views = segments.map((segment) => {
        const view = this.container.createEmbeddedView(this.template, { $implicit: segment })
        view.detectChanges()
        return view
      })
    }
    if (this.server) return draw(this.root.controller.segments.peek())
    this.destroy.onDestroy(
      effect(() => {
        const segments = this.root.controller.segments.get()
        drawing(() => draw(segments))
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpTimeFieldSegments,
    _context: unknown
  ): _context is { $implicit: TimeFieldSegment } {
    return true
  }
}

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
@Directive({ selector: "[kpTimeFieldSegment]" })
export class KpTimeFieldSegment implements OnInit {
  readonly segment = input.required<TimeFieldSegment>()
  private readonly root = inject(KpTimeField)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly put = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    const { part, text } = this.root.controller.segment(this.segment())
    this.put(part)
    // The text a server wrote is the one kept.
    const written = this.element.firstChild
    const node =
      written?.nodeType === 3
        ? (written as Text)
        : this.element.insertBefore(this.element.ownerDocument.createTextNode(text.peek()), written)
    if (this.server) return
    this.destroy.onDestroy(
      effect(() => {
        node.data = text.get()
      })
    )
  }
}

/** `<input kpTimeFieldInput>`: the hidden input it is submitted by. */
@Directive({ selector: "input[kpTimeFieldInput]" })
export class KpTimeFieldInput implements OnInit {
  private readonly root = inject(KpTimeField)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.input)
  }
}
