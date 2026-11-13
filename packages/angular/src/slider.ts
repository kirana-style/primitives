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
import type { OnInit } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createSlider } from "@kirana-ui/core/slider"
import type { Slider, SliderChangeDetails, SliderProps, SliderValue } from "@kirana-ui/core/slider"

import { KUI_DIRECTION } from "./direction-token"
import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted } from "./runtime"

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

@Directive({ selector: "[kuiSlider]", exportAs: "kuiSlider" })
export class KuiSlider implements OnInit {
  readonly value = model<SliderValue | undefined>(undefined)
  readonly defaultValue = input<SliderValue>()
  readonly min = input(undefined, { transform: optionalNumber })
  readonly max = input(undefined, { transform: optionalNumber })
  readonly step = input(undefined, { transform: optionalNumber })
  readonly largeStep = input(undefined, { transform: optionalNumber })
  readonly minStepsBetweenValues = input(undefined, { transform: optionalNumber })
  readonly orientation = input<"horizontal" | "vertical">()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly format = input<Intl.NumberFormatOptions>()
  readonly locale = input<string>()
  readonly getAriaValueText = input<SliderProps["getAriaValueText"]>()
  readonly kuiId = input<string>()
  /** Each step of a drag and each key, with why; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: number | number[]; details: SliderChangeDetails }>()
  /** When the pointer lets go, and after each key. */
  readonly valueCommitted = output<{ value: number | number[]; details: SliderChangeDetails }>()

  controller!: Slider
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    min: this.min(),
    max: this.max(),
    step: this.step(),
    largeStep: this.largeStep(),
    minStepsBetweenValues: this.minStepsBetweenValues(),
    orientation: this.orientation(),
    disabled: this.disabled(),
    name: this.name(),
    form: this.form(),
    format: this.format(),
    locale: this.locale(),
    getAriaValueText: this.getAriaValueText(),
    onValueChange: (value: number | number[], details: SliderChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onValueCommitted: (value: number | number[], details: SliderChangeDetails) =>
      this.valueCommitted.emit({ value, details }),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createSlider(this.props(), {
      field: this.field?.controller,
      direction: this.around?.direction,
    })
    this.part(this.controller.root)
    this.mount(this.controller)
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
  /** Which value of a range the thumb is, from 0. */
  readonly index = input(0, { transform: numberAttribute })
  private readonly root = inject(KuiSlider)
  private readonly part = hostPart()
  private readonly inner = innerPart("input")

  ngOnInit(): void {
    this.part(this.root.controller.thumb(this.index()))
    this.inner(this.root.controller.thumbInput(this.index()))
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
