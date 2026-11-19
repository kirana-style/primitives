import {
  Directive,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckboxGroup } from "@kirana-ui/core/checkbox-group"
import type { CheckboxGroup } from "@kirana-ui/core/checkbox-group"

import { KUI_CHECKBOX_GROUP } from "./checkbox-group-token"
import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, inputsSignal } from "./runtime"

/**
 * Checkboxes that hold one list of values. Each `kuiCheckbox` with a `value` inside it is
 * checked while the list has its value; with `allValues`, a `kuiCheckbox` marked `parent`
 * stands for them all.
 */
@Directive({
  selector: "[kuiCheckboxGroup]",
  exportAs: "kuiCheckboxGroup",
  providers: [{ provide: KUI_CHECKBOX_GROUP, useExisting: forwardRef(() => KuiCheckboxGroup) }],
})
export class KuiCheckboxGroup implements OnInit {
  readonly value = model<readonly string[] | undefined>(undefined)
  readonly defaultValue = input<readonly string[]>()
  /** The value of every checkbox of the group, for a parent checkbox. */
  readonly allValues = input<readonly string[]>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: string[]; details: ChangeDetails }>()

  controller!: CheckboxGroup
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    allValues: this.allValues(),
    disabled: this.disabled(),
    onValueChange: (value: string[], details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createCheckboxGroup(this.props(), { field: this.field?.controller })
    this.put(this.controller.root)
  }
}
