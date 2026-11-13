import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createSwitch } from "@kirana-ui/core/switch"
import type { Switch } from "@kirana-ui/core/switch"

import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, innerPart, inputsSignal, mounted } from "./runtime"

/** On the box's element. It draws the hidden native input inside it, which a form and a label reach. */
@Directive({ selector: "[kuiSwitch]", exportAs: "kuiSwitch" })
export class KuiSwitch implements OnInit {
  readonly checked = model<boolean | undefined>(undefined)
  readonly defaultChecked = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly value = input<string>()
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly checkedChanged = output<{ checked: boolean; details: ChangeDetails }>()

  controller!: Switch
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
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
    this.controller = createSwitch(this.props(), { field: this.field?.controller })
    this.part(this.controller.root)
    this.inner(this.controller.input)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiSwitchThumb]" })
export class KuiSwitchThumb implements OnInit {
  private readonly root = inject(KuiSwitch)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.thumb)
  }
}
