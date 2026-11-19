import {
  DestroyRef,
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createRadioGroup } from "@kirana-ui/core/radio-group"
import type { RadioGroup } from "@kirana-ui/core/radio-group"

import { KUI_DIRECTION } from "./direction-token"
import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiRadioGroup]", exportAs: "kuiRadioGroup" })
export class KuiRadioGroup<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: Value | null; details: ChangeDetails }>()

  controller!: RadioGroup<Value>
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: Value | null, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

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
  /** The id of the item's native radio, unique in the page: a `<label for>` names it. */
  readonly kuiId = input<string>()
  readonly group = inject(KuiRadioGroup)
  private readonly part = hostPart()
  private readonly inner = innerPart("input")
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    id: this.kuiId(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

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
