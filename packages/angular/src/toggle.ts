import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"

import { hostPart, inputsSignal } from "./runtime"
import { KUI_TOGGLE_GROUP, KUI_TOOLBAR } from "./toolbar"

/** Inside a `kuiToggleGroup`, `value` makes it one of the group's toggles. */
@Directive({ selector: "[kuiToggle]", exportAs: "kuiToggle" })
export class KuiToggle implements OnInit {
  readonly pressed = model<boolean | undefined>(undefined)
  readonly defaultPressed = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /** In a toggle group: what the group's value holds while this one is pressed. */
  readonly value = input<unknown>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly pressedChanged = output<{ pressed: boolean; details: ChangeDetails }>()

  private readonly group = inject(KUI_TOGGLE_GROUP, { optional: true })
  private readonly toolbar = inject(KUI_TOOLBAR, { optional: true })
  private readonly props = inputsSignal(() => ({
    pressed: this.pressed(),
    defaultPressed: this.defaultPressed(),
    disabled: this.disabled(),
    value: this.value(),
    onPressedChange: (pressed: boolean, details: ChangeDetails) => {
      this.pressedChanged.emit({ pressed, details })
      if (!details.canceled) {
        this.pressed.set(pressed)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()

  ngOnInit(): void {
    const around = {
      group: this.group?.controller,
      toolbar: this.toolbar?.controller,
    }
    this.part(createToggle(this.props(), around).root)
  }
}
