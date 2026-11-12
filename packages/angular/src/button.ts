import { Directive, booleanAttribute, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import { createButton } from "@kirana-ui/core/button"

import { hostPart, inputsSignal } from "./runtime"

/** On a `<button>`, or with `[nativeButton]="false"` on another element that acts as one. */
@Directive({ selector: "[kuiButton]" })
export class KuiButton implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly focusableWhenDisabled = input(false, { transform: booleanAttribute })
  readonly nativeButton = input(true, { transform: booleanAttribute })
  private readonly props = inputsSignal(() => ({
    disabled: this.disabled(),
    focusableWhenDisabled: this.focusableWhenDisabled(),
    nativeButton: this.nativeButton(),
  }))
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(createButton(this.props()).root)
  }
}
