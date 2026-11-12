import { Directive, booleanAttribute, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"

import { hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kuiToggle]", exportAs: "kuiToggle" })
export class KuiToggle implements OnInit {
  readonly pressed = model<boolean | undefined>(undefined)
  readonly defaultPressed = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly pressedChanged = output<{ pressed: boolean; details: ChangeDetails }>()

  private readonly props = inputsSignal(() => ({
    pressed: this.pressed(),
    defaultPressed: this.defaultPressed(),
    disabled: this.disabled(),
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
    this.part(createToggle(this.props()).root)
  }
}
