import {
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberField } from "@kirana-ui/core/number-field"

import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted } from "./runtime"

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
