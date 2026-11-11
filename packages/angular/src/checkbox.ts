import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { Checkbox } from "@kirana-ui/core/checkbox"

import { KuiIds, hostPart, innerPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** On the box's element. It draws the hidden native input inside it, which a form and a label reach. */
@Directive({ selector: "[kuiCheckbox]", exportAs: "kuiCheckbox" })
export class KuiCheckbox implements OnInit {
  readonly checked = model<boolean | undefined>(undefined)
  readonly defaultChecked = input(false, { transform: booleanAttribute })
  readonly indeterminate = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  readonly value = input<string>()
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly checkedChanged = output<{ checked: boolean; details: ChangeDetails }>()

  controller!: Checkbox
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    indeterminate: this.indeterminate(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    value: this.value(),
    onCheckedChange: (checked: boolean, details: ChangeDetails) => {
      this.checkedChanged.emit({ checked, details })
      if (!details.canceled) {
        this.checked.set(checked)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly inner = innerPart("input")
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createCheckbox(this.props())
    this.part(this.controller.root)
    this.inner(this.controller.input)
    this.mount(this.controller)
  }
}

/** `<span *kuiCheckboxIndicator>`: in the page while the box is checked or indeterminate. */
@Directive({ selector: "[kuiCheckboxIndicator]" })
export class KuiCheckboxIndicator implements OnInit {
  private readonly root = inject(KuiCheckbox)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.indicatorMounted, this.root.controller.indicator)
  }
}
