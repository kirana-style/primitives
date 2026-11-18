import {
  Directive,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  untracked,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberField } from "@kirana-ui/core/number-field"

import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted, presentWhile } from "./runtime"

const optionalNumber = (value: unknown) => (value == null ? undefined : numberAttribute(value))

/**
 * On the element that holds the field's parts. `[(value)]` is the number, `null` for none.
 * With a name, it draws the hidden input a form reads.
 */
@Directive({ selector: "[kuiNumberField]", exportAs: "kuiNumberField" })
export class KuiNumberField implements OnInit {
  readonly value = model<number | null | undefined>(undefined)
  readonly defaultValue = input<number | null>()
  readonly min = input(undefined, { transform: optionalNumber })
  readonly max = input(undefined, { transform: optionalNumber })
  readonly step = input(undefined, { transform: optionalNumber })
  readonly smallStep = input(undefined, { transform: optionalNumber })
  readonly largeStep = input(undefined, { transform: optionalNumber })
  readonly snapOnStep = input(false, { transform: booleanAttribute })
  readonly allowWheelScrub = input(false, { transform: booleanAttribute })
  readonly format = input<Intl.NumberFormatOptions>()
  readonly locale = input<string>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: number | null; details: ChangeDetails }>()
  /** A change that is done: focus left the input, a key or a button stepped it. */
  readonly valueCommitted = output<{ value: number | null; details: ChangeDetails }>()

  controller!: NumberField
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    min: this.min(),
    max: this.max(),
    step: this.step(),
    smallStep: this.smallStep(),
    largeStep: this.largeStep(),
    snapOnStep: this.snapOnStep(),
    allowWheelScrub: this.allowWheelScrub(),
    format: this.format(),
    locale: this.locale(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: number | null, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onValueCommitted: (value: number | null, details: ChangeDetails) =>
      this.valueCommitted.emit({ value, details }),
  }))
  private readonly part = hostPart()
  private readonly inner = innerPart("input")
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createNumberField(this.props(), { field: this.field?.controller })
    this.part(this.controller.root)
    // Named when it is first drawn, it has the hidden input a form reads.
    if (this.controller.named.peek()) this.inner(this.controller.hidden)
    this.mount(this.controller)
  }
}

function part(name: "group" | "input" | "increment" | "decrement") {
  const root = inject(KuiNumberField)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiNumberFieldGroup]" })
export class KuiNumberFieldGroup implements OnInit {
  private readonly init = part("group")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiNumberFieldInput]" })
export class KuiNumberFieldInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiNumberFieldIncrement]" })
export class KuiNumberFieldIncrement implements OnInit {
  private readonly init = part("increment")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiNumberFieldDecrement]" })
export class KuiNumberFieldDecrement implements OnInit {
  private readonly init = part("decrement")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * On the element that is pressed and dragged to change the number: the field's label, as a
 * rule.
 */
@Directive({ selector: "[kuiNumberFieldScrubArea]" })
export class KuiNumberFieldScrubArea implements OnInit {
  /**
   * The way the pointer is dragged: `"horizontal"`, where right is more, or `"vertical"`, where
   * up is more. Default `"horizontal"`.
   */
  readonly direction = input<"horizontal" | "vertical">()
  /** How many pixels the pointer moves before the number changes. Default 2. */
  readonly pixelSensitivity = input(undefined, { transform: optionalNumber })
  /**
   * How far past the area's edges the drawn cursor goes before it comes back in at the other
   * side. Default: the edges of the window.
   */
  readonly teleportDistance = input(undefined, { transform: optionalNumber })
  private readonly root = inject(KuiNumberField)
  private readonly put = hostPart()
  private readonly options = () =>
    defined({
      direction: this.direction(),
      pixelSensitivity: this.pixelSensitivity(),
      teleportDistance: this.teleportDistance(),
    })

  constructor() {
    effect(() => {
      const options = this.options()
      untracked(() => this.root.controller?.scrub.set(options))
    })
  }

  ngOnInit(): void {
    this.root.controller.scrub.set(this.options())
    this.put(this.root.controller.scrubArea)
  }
}

/**
 * `<span *kuiNumberFieldScrubAreaCursor>`: drawn in place of the pointer while it is locked for
 * a drag, at the end of the page.
 */
@Directive({ selector: "[kuiNumberFieldScrubAreaCursor]" })
export class KuiNumberFieldScrubAreaCursor implements OnInit {
  private readonly root = inject(KuiNumberField)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    const cursor = this.root.controller.scrubAreaCursor
    this.present(cursor.mounted, cursor.part)
  }
}
