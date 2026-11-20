import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createToggle } from "@kirana-ui/core/toggle"

import { hostPart, inputsSignal } from "./runtime"
import { KP_TOGGLE_GROUP, KP_TOOLBAR } from "./toolbar"

/** Inside a `kpToggleGroup`, `value` makes it one of the group's toggles. */
@Directive({ selector: "[kpToggle]", exportAs: "kpToggle" })
export class KpToggle implements OnInit {
  readonly pressed = model<boolean | undefined>(undefined)
  readonly defaultPressed = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /** In a toggle group: what the group's value holds while this one is pressed. */
  readonly value = input<unknown>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly pressedChanged = output<{ pressed: boolean; details: ChangeDetails }>()

  private readonly group = inject(KP_TOGGLE_GROUP, { optional: true })
  private readonly toolbar = inject(KP_TOOLBAR, { optional: true })
  private readonly props = inputsSignal(this, () => ({
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

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    const around = {
      group: this.group?.controller,
      toolbar: this.toolbar?.controller,
    }
    this.part(createToggle(this.props(), around).root)
  }
}
