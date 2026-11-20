import { Directive, booleanAttribute, inject, input, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createInput } from "@kirana-ui/core/input"

import { KP_FIELD } from "./field-token"
import { hostPart, inputsSignal } from "./runtime"

/**
 * `<input kpInput>` or `<textarea kpInput>`: it says its state, and inside a `kpField` it is
 * the field's control. Its value is the element's own (`[value]`, `ngModel`).
 */
@Directive({ selector: "[kpInput]", exportAs: "kpInput" })
export class KpInput implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly valueChanged = output<{ value: string; details: ChangeDetails }>()
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly props = inputsSignal(this, () => ({
    disabled: this.disabled(),
    onValueChange: (value: string, details: ChangeDetails) =>
      this.valueChanged.emit({ value, details }),
  }))
  private readonly part = hostPart()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.part(createInput(this.props(), { field: this.field?.controller }).input)
  }
}
