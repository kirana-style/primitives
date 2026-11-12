import {
  DestroyRef,
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup } from "@kirana-ui/core/radio-group"

import { KUI_DIRECTION } from "./direction-token"
import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiRadioGroup]", exportAs: "kuiRadioGroup" })
export class KuiRadioGroup implements OnInit {
  readonly value = model<unknown>(undefined)
  readonly defaultValue = input<unknown>(null)
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: unknown; details: ChangeDetails }>()

  controller!: RadioGroup
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    onValueChange: (value: unknown, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createRadioGroup(this.props(), {
      field: this.field?.controller,
      direction: this.around?.direction,
    })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

/** On an item's element. It draws the hidden native radio inside it, which a form and a label reach. */
@Directive({ selector: "[kuiRadioGroupItem]" })
export class KuiRadioGroupItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly group = inject(KuiRadioGroup)
  private readonly part = hostPart()
  private readonly inner = innerPart("input")
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    const read = () => defined(options.get())
    this.part(this.group.controller.item(this.value(), read))
    this.inner(this.group.controller.itemInput(this.value(), read))
  }
}

/** `<span *kuiRadioGroupIndicator>`: in the page while its item is the chosen one. */
@Directive({ selector: "[kuiRadioGroupIndicator]" })
export class KuiRadioGroupIndicator implements OnInit {
  private readonly item = inject(KuiRadioGroupItem)
  private readonly destroy = inject(DestroyRef)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const indicator = this.item.group.controller.indicator(this.item.value())
    this.destroy.onDestroy(indicator.mount())
    this.present(indicator.mounted, indicator.part)
  }
}
