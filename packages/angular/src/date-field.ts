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
import type { ChangeDetails } from "@kirana-ui/core"
import { createDateField } from "@kirana-ui/core/date-field"
import type { DateField, DateFieldProps, DateFieldSegment } from "@kirana-ui/core/date-field"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal, mounted, onServer } from "./runtime"

@Directive({ selector: "[kuiDateField]", exportAs: "kuiDateField" })
export class KuiDateField implements OnInit {
  /** The day typed, once all of it is: `[(value)]`. */
  readonly value = model<string | null | undefined>(undefined)
  readonly defaultValue = input<string | null>()
  /** The language and region that order the day, the month and the year. */
  readonly locale = input<string>()
  readonly min = input<string>()
  readonly max = input<string>()
  readonly placeholders = input<DateFieldProps["placeholders"]>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form it belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: string | null; details: ChangeDetails }>()

  controller!: DateField
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
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

  ngOnInit(): void {
    this.controller = createDateField(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

/** `<span *kuiDateFieldSegments="let segment">`: once for each piece of the date. */
@Directive({ selector: "[kuiDateFieldSegments]" })
export class KuiDateFieldSegments implements OnInit {
  private readonly root = inject(KuiDateField)
  private readonly template = inject<TemplateRef<{ $implicit: DateFieldSegment }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private views: EmbeddedViewRef<{ $implicit: DateFieldSegment }>[] = []

  ngOnInit(): void {
    const draw = (segments: readonly DateFieldSegment[]) => {
      // The pieces change only with the locale: drawn again whole when they do.
      for (const view of this.views) view.destroy()
      this.views = segments.map((segment) => {
        const view = this.container.createEmbeddedView(this.template, { $implicit: segment })
        view.detectChanges()
        return view
      })
    }
    if (this.server) return draw(this.root.controller.segments.peek())
    this.destroy.onDestroy(effect(() => draw(this.root.controller.segments.get())))
  }
}

/** One piece: a part that is typed, or what stands between two. It writes its own text. */
@Directive({ selector: "[kuiDateFieldSegment]" })
export class KuiDateFieldSegment implements OnInit {
  readonly segment = input.required<DateFieldSegment>()
  private readonly root = inject(KuiDateField)
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

/** `<input kuiDateFieldInput>`: the hidden input it is submitted by. */
@Directive({ selector: "input[kuiDateFieldInput]" })
export class KuiDateFieldInput implements OnInit {
  private readonly root = inject(KuiDateField)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.input)
  }
}
