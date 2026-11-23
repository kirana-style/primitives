import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCheckbox } from "@kirana-ui/core/checkbox"
import type { Checkbox } from "@kirana-ui/core/checkbox"

import { KP_CHECKBOX_GROUP } from "./checkbox-group-token"
import { KP_FIELD } from "./field-token"
import { KpIds, hostPart, innerPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** On the box's element. It draws the hidden native input inside it, which a form and a label reach. */
@Directive({ selector: "[kpCheckbox]", exportAs: "kpCheckbox" })
export class KpCheckbox implements OnInit {
  readonly checked = model<boolean | undefined>(undefined)
  readonly defaultChecked = input(false, { transform: booleanAttribute })
  readonly indeterminate = input(false, { transform: booleanAttribute })
  /**
   * In a `kpCheckboxGroup` with `allValues`: the box that stands for them all, written anywhere
   * inside the group. It is checked when every one is, mixed when some are, and it is not
   * submitted; its `aria-controls` names the boxes. A press from mixed checks them all, the next
   * unchecks them all, and the next brings back the set they were left in (left all checked or
   * none, a press goes between all and none); a disabled box keeps its state. Read once.
   */
  readonly parent = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly value = input<string>()
  /** The id of the box's hidden native checkbox, not of the box: a `<label for>` names it. Inside a `Field`, that input takes the field's id instead. */
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly checkedChanged = output<{ checked: boolean; details: ChangeDetails }>()

  controller!: Checkbox
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly group = inject(KP_CHECKBOX_GROUP, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    indeterminate: this.indeterminate(),
    parent: this.parent(),
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

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createCheckbox(this.props(), {
      field: this.field?.controller,
      group: this.group?.controller,
    })
    this.part(this.controller.root)
    this.inner(this.controller.input)
    this.mount(this.controller)
  }
}

/**
 * `<span *kpCheckboxIndicator>`: in the page while the box is checked or indeterminate. Its
 * template is given nothing: a dash while mixed and a tick while checked are both written in it
 * and chosen in CSS by the element's `data-indeterminate` (`[data-indeterminate] .tick`,
 * `:not([data-indeterminate]) > .dash`, each `display: none`).
 */
@Directive({ selector: "[kpCheckboxIndicator]" })
export class KpCheckboxIndicator implements OnInit {
  private readonly root = inject(KpCheckbox)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.indicatorMounted, this.root.controller.indicator)
  }
}
