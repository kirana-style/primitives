import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails, Orientation, ReadonlySignal, StateOf } from "@kirana-ui/core"
import { createColorPicker } from "@kirana-ui/core/color-picker"
import type {
  ColorFormat,
  ColorPicker,
  ColorPickerInputChannel,
  ColorPickerProps,
  ColorPickerSliderChannel,
} from "@kirana-ui/core/color-picker"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_DIRECTION } from "./direction-token"
import { KP_FIELD } from "./field-token"
import {
  KpIds,
  hostPart,
  innerPart,
  inputsSignal,
  mounted,
  onServer,
  ownText,
  statePart,
} from "./runtime"

/**
 * On the element that holds the picker's parts. `[(value)]` is the colour as text in its
 * format, `[(format)]` the format. It draws the hidden input a form reads, as its last child.
 */
@Directive({ selector: "[kpColorPicker]", exportAs: "kpColorPicker" })
export class KpColorPicker implements OnInit {
  /** The colour as text in `format`. Any format is read. */
  readonly value = model<string | undefined>(undefined)
  /** Read once. Default `#000000`. */
  readonly defaultValue = input<string>()
  readonly format = model<ColorFormat | undefined>(undefined)
  /** Read once. Default `"hex"`. */
  readonly defaultFormat = input<ColorFormat>()
  /** Whether the opacity can be chosen: the value then always carries its alpha. */
  readonly alpha = input(false, { transform: booleanAttribute })
  /** `"edge"` keeps a thumb inside its area or track at the ends of its range. */
  readonly thumbAlignment = input<"center" | "edge">()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** Shown as it is, focusable, not changeable; its value is still submitted. */
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the picker belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly getAriaValueText = input<ColorPickerProps["getAriaValueText"]>()
  readonly kpId = input<string>()
  /** Each step of a drag, each key, each colour typed or chosen; `details.cancel()` keeps it. */
  readonly valueChanged = output<{ value: string; details: ChangeDetails }>()
  /** When the pointer lets go, after each key, when a typed channel is left: the value to save. */
  readonly valueCommitted = output<{ value: string; details: ChangeDetails }>()
  /** When the format trigger goes to the next format; `details.cancel()` keeps it. */
  readonly formatChanged = output<{ format: ColorFormat; details: ChangeDetails }>()

  controller!: ColorPicker
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    format: this.format(),
    defaultFormat: this.defaultFormat(),
    alpha: this.alpha(),
    thumbAlignment: this.thumbAlignment(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    getAriaValueText: this.getAriaValueText(),
    onValueChange: (value: string, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onValueCommitted: (value: string, details: ChangeDetails) =>
      this.valueCommitted.emit({ value, details }),
    onFormatChange: (format: ColorFormat, details: ChangeDetails) => {
      this.formatChanged.emit({ format, details })
      if (!details.canceled) {
        this.format.set(format)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly inner = innerPart("input")
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createColorPicker(this.props(), {
      field: this.field?.controller,
      direction: this.around?.direction,
    })
    this.part(this.controller.root)
    this.inner(this.controller.input)
    this.mount(this.controller)
  }
}

function part(name: "area" | "areaThumb" | "swatch" | "eyeDropperTrigger") {
  const root = inject(KpColorPicker)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpColorPickerArea]" })
export class KpColorPickerArea implements OnInit {
  private readonly init = part("area")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpColorPickerAreaThumb]" })
export class KpColorPickerAreaThumb implements OnInit {
  private readonly init = part("areaThumb")

  ngOnInit(): void {
    this.init()
  }
}

/** What a pointer presses and drags on to move a channel: its track and thumb are inside it. */
@Directive({ selector: "[kpColorPickerChannelSlider]" })
export class KpColorPickerChannelSlider implements OnInit {
  /** The channel it moves: the hue, or the alpha. */
  readonly channel = input.required<ColorPickerSliderChannel>()
  /** The way its track runs. Default `horizontal`. */
  readonly orientation = input<Orientation>("horizontal")
  private readonly root = inject(KpColorPicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.channelSlider(this.channel(), this.orientation()))
  }
}

/** A part of the slider around it, which says the channel and the way it runs. */
function sliderPart(name: "channelSliderTrack" | "channelSliderThumb") {
  const root = inject(KpColorPicker)
  const slider = inject(KpColorPickerChannelSlider)
  const put = hostPart()
  return () => put(root.controller[name](slider.channel(), slider.orientation()))
}

@Directive({ selector: "[kpColorPickerChannelSliderTrack]" })
export class KpColorPickerChannelSliderTrack implements OnInit {
  private readonly init = sliderPart("channelSliderTrack")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpColorPickerChannelSliderThumb]" })
export class KpColorPickerChannelSliderThumb implements OnInit {
  private readonly init = sliderPart("channelSliderThumb")

  ngOnInit(): void {
    this.init()
  }
}

/** On an `<input>`: one channel typed in, or the whole colour in hex. Its text is the core's. */
@Directive({ selector: "[kpColorPickerChannelInput]" })
export class KpColorPickerChannelInput implements OnInit {
  /** The channel it is typed in, or `hex` for the whole colour. */
  readonly channel = input.required<ColorPickerInputChannel>()
  private readonly root = inject(KpColorPicker)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.channelInput(this.channel()))
  }
}

@Directive({ selector: "[kpColorPickerSwatch]" })
export class KpColorPickerSwatch implements OnInit {
  private readonly init = part("swatch")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * A preset: pressed, the colour is this one. `state()` is its state, for the template
 * (`#preset="kpColorPickerSwatchTrigger"`, `preset.state().selected`).
 */
@Directive({ selector: "[kpColorPickerSwatchTrigger]", exportAs: "kpColorPickerSwatchTrigger" })
export class KpColorPickerSwatchTrigger implements OnInit {
  /** The preset's colour, in any format. */
  readonly value = input.required<string>()
  private readonly root = inject(KpColorPicker)
  private readonly put = statePart<StateOf<Vocabulary["colorPicker"]["swatchTrigger"]>>()
  /** The part's state, as its `data-*` attributes say it, for the template. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.swatchTrigger(this.value()))
  }
}

/** Picks a colour from the screen, where the browser can; hidden where it cannot. */
@Directive({ selector: "[kpColorPickerEyeDropperTrigger]" })
export class KpColorPickerEyeDropperTrigger implements OnInit {
  private readonly init = part("eyeDropperTrigger")

  ngOnInit(): void {
    this.init()
  }
}

/** A part that writes a text of the picker's, unless its element has content of its own. */
function writing(
  name: "valueText" | "formatTrigger",
  said: (picker: ColorPicker) => ReadonlySignal<string>
) {
  const root = inject(KpColorPicker)
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  const destroy = inject(DestroyRef)
  const put = hostPart()
  const server = onServer()
  return () => {
    const { controller } = root
    put(controller[name])
    // Content of the element's own is what it says.
    const text = ownText(element, server)
    if (!text) return
    const source = said(controller)
    destroy.onDestroy(
      effect(() => {
        text.data = source.get()
      })
    )
  }
}

/** Says the colour in its format, unless the element has content of its own. */
@Directive({ selector: "[kpColorPickerValueText]" })
export class KpColorPickerValueText implements OnInit {
  private readonly init = writing("valueText", (picker) => picker.text)

  ngOnInit(): void {
    this.init()
  }
}

/** Goes to the next format; says the current one, unless the element has content of its own. */
@Directive({ selector: "[kpColorPickerFormatTrigger]" })
export class KpColorPickerFormatTrigger implements OnInit {
  private readonly init = writing("formatTrigger", (picker) => picker.format)

  ngOnInit(): void {
    this.init()
  }
}
