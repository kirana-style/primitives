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

import { KP_CHECKBOX_GROUP } from "./checkbox-group-token"
import { KP_FIELD } from "./field-token"
import { KpIds, hostPart, inputsSignal } from "./runtime"

/**
 * Checkboxes that hold one list of values. Each `kpCheckbox` with a `value` inside it is
 * checked while the list has its value; with `allValues`, a `kpCheckbox` marked `parent`
 * stands for them all.
 */
@Directive({
  selector: "[kpCheckboxGroup]",
  exportAs: "kpCheckboxGroup",
  providers: [{ provide: KP_CHECKBOX_GROUP, useExisting: forwardRef(() => KpCheckboxGroup) }],
})
export class KpCheckboxGroup implements OnInit {
  readonly value = model<readonly string[] | undefined>(undefined)
  readonly defaultValue = input<readonly string[]>()
  /**
   * The value of every checkbox of the group, for a parent checkbox: it is checked when all of
   * them are, mixed when some are, and a press on it goes from the set they were left in to
   * all, then none, then back. Its order names the boxes' elements (`<id>-0` …).
   */
  readonly allValues = input<readonly string[]>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** The group's own id, and what its boxes' elements are named from (`<id>-0`, `<id>-1` …, by their place in `allValues`), which a parent box's `aria-controls` names. Inside a `Field`, the group takes the field's id instead. */
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: string[]; details: ChangeDetails }>()

  controller!: CheckboxGroup
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
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
