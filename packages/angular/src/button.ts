import { Directive, booleanAttribute, input } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { createButton } from "@kirana-ui/core/button"

import { hostPart, inputsSignal } from "./runtime"

/**
 * On a `<button>`, or with `[nativeButton]="false"` on another element that acts as one; on a
 * link that navigates (`<a href>`), it stays a link.
 */
@Directive({ selector: "[kpButton]", exportAs: "kpButton" })
export class KpButton implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly focusableWhenDisabled = input(false, { transform: booleanAttribute })
  readonly nativeButton = input(true, { transform: booleanAttribute })
  private readonly props = inputsSignal(this, () => ({
    disabled: this.disabled(),
    focusableWhenDisabled: this.focusableWhenDisabled(),
    nativeButton: this.nativeButton(),
  }))
  private readonly part = hostPart()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.part(createButton(this.props()).root)
  }
}
