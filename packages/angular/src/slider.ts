import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { AfterViewInit, OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type {
  Slider,
  SliderChangeDetails,
  SliderProps,
  SliderTold,
  SliderValue,
} from "@kirana-ui/core/slider"

import { KUI_DIRECTION } from "./direction-token"
import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted } from "./runtime"

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

@Directive({ selector: "[kuiSlider]", exportAs: "kuiSlider" })
export class KuiSlider<Value extends SliderValue = SliderValue> implements OnInit, AfterViewInit {
  /** A number for one thumb, a list for a range: what is told back is the same kind. */
  readonly value = model<Value | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value>>()
  readonly min = input(undefined, { transform: optionalNumber })
  readonly max = input(undefined, { transform: optionalNumber })
  readonly step = input(undefined, { transform: optionalNumber })
  readonly largeStep = input(undefined, { transform: optionalNumber })
  readonly minStepsBetweenValues = input(undefined, { transform: optionalNumber })
  /** `"edge"` keeps a thumb inside the control at the ends of its range. */
  readonly thumbAlignment = input<"center" | "edge" | "edge-client-only">()
  readonly orientation = input<"horizontal" | "vertical">()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** Shown as it is, focusable, not changeable; its value is still submitted. */
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly format = input<Intl.NumberFormatOptions>()
  readonly locale = input<string>()
  readonly getAriaValueText = input<SliderProps["getAriaValueText"]>()
  readonly kuiId = input<string>()
  /** Each step of a drag and each key, with why; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: SliderTold<Value>; details: SliderChangeDetails }>()
  /** When the pointer lets go, and after each key. */
  readonly valueCommitted = output<{ value: SliderTold<Value>; details: SliderChangeDetails }>()

  controller!: Slider
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    min: this.min(),
    max: this.max(),
    step: this.step(),
    largeStep: this.largeStep(),
    minStepsBetweenValues: this.minStepsBetweenValues(),
    thumbAlignment: this.thumbAlignment(),
    orientation: this.orientation(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    name: this.name(),
    form: this.form(),
    format: this.format(),
    locale: this.locale(),
    getAriaValueText: this.getAriaValueText(),
    onValueChange: (value: SliderTold<Value>, details: SliderChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        // What is told is the kind that was given.
        this.value.set(value as unknown as Value)
        this.props.sync()
      }
    },
    onValueCommitted: (value: SliderTold<Value>, details: SliderChangeDetails) =>
      this.valueCommitted.emit({ value, details }),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()
  // A thumb with no index is placed by the order the thumbs are asked for in, and Angular
  // makes what is inside an `@if` after what is written beside it. So the thumbs of a slider's
  // first drawing wait until all are made, and are asked for in their elements' order: a
  // server writes a part once, and in a browser a thumb first written at another's place
  // would be seen to move to its own.
  private waiting: { element: HTMLElement; put(): void }[] | undefined = []

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createSlider(this.props(), {
      field: this.field?.controller,
      direction: this.around?.direction,
    })
    this.part(this.controller.root)
    this.mount(this.controller)
  }

  ngAfterViewInit(): void {
    const waiting = this.waiting
    this.waiting = undefined
    if (!waiting) return
    // 4: the other element follows this one in the page.
    waiting.sort((a, b) => (a.element.compareDocumentPosition(b.element) & 4 ? -1 : 1))
    for (const each of waiting) each.put()
  }

  /** Puts a thumb on its element: with the others of the first drawing, at once after it. */
  thumb(element: HTMLElement, put: () => void): void {
    if (this.waiting) this.waiting.push({ element, put })
    else put()
  }
}

function part(name: "control" | "track" | "indicator") {
  const root = inject(KuiSlider)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiSliderControl]" })
export class KuiSliderControl implements OnInit {
  private readonly init = part("control")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiSliderTrack]" })
export class KuiSliderTrack implements OnInit {
  private readonly init = part("track")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiSliderIndicator]" })
export class KuiSliderIndicator implements OnInit {
  private readonly init = part("indicator")

  ngOnInit(): void {
    this.init()
  }
}

/** On a thumb's element. It draws the hidden input inside it, which a form reads. */
@Directive({ selector: "[kuiSliderThumb]" })
export class KuiSliderThumb implements OnInit {
  /**
   * Which value of a range the thumb is, from 0. A thumb that is given none takes its place
   * among the slider's thumbs, in the order they are written.
   */
  readonly index = input(undefined, { transform: optionalNumber })
  private readonly root = inject(KuiSlider)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly generated = inject(KuiIds).make()
  private readonly part = hostPart()
  private readonly inner = innerPart("input")

  ngOnInit(): void {
    this.root.thumb(this.element, () => {
      const at = this.index() ?? this.generated
      this.part(this.root.controller.thumb(at))
      this.inner(this.root.controller.thumbInput(at))
    })
  }
}

/** Shows the written value. */
@Directive({ selector: "[kuiSliderValue]" })
export class KuiSliderValue implements OnInit {
  private readonly root = inject(KuiSlider)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.value)
    this.destroy.onDestroy(
      effect(() => {
        this.element.textContent = this.root.controller.text.get()
      })
    )
  }
}
