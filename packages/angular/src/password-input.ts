import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createPasswordInput } from "@kirana-ui/core/password-input"
import type { PasswordInput } from "@kirana-ui/core/password-input"

import { KP_FIELD } from "./field-token"
import { hostPart, inputsSignal, mounted } from "./runtime"

/**
 * On the element that holds the password's parts. `[(visible)]` is whether the password can be
 * read. Its value is the input's own (`[value]`, `ngModel`).
 */
@Directive({ selector: "[kpPasswordInput]", exportAs: "kpPasswordInput" })
export class KpPasswordInput implements OnInit {
  readonly visible = model<boolean | undefined>(undefined)
  readonly defaultVisible = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /** About to be shown or hidden; `details.cancel()` keeps it as it was. */
  readonly visibleChanged = output<{ visible: boolean; details: ChangeDetails }>()
  /** What was typed, as text, each time it changes. */
  readonly valueChanged = output<{ value: string; details: ChangeDetails }>()

  controller!: PasswordInput
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly props = inputsSignal(this, () => ({
    visible: this.visible(),
    defaultVisible: this.defaultVisible(),
    disabled: this.disabled(),
    onVisibleChange: (visible: boolean, details: ChangeDetails) => {
      this.visibleChanged.emit({ visible, details })
      if (!details.canceled) {
        this.visible.set(visible)
        this.props.sync()
      }
    },
    onValueChange: (value: string, details: ChangeDetails) =>
      this.valueChanged.emit({ value, details }),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createPasswordInput(this.props(), { field: this.field?.controller })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "input" | "toggle" | "indicator") {
  const root = inject(KpPasswordInput)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** `<input kpPasswordInputInput>`: a password, or text while it is shown. */
@Directive({ selector: "[kpPasswordInputInput]" })
export class KpPasswordInputInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

/** Shows the password, and hides it again. */
@Directive({ selector: "[kpPasswordInputToggle]" })
export class KpPasswordInputToggle implements OnInit {
  private readonly init = part("toggle")

  ngOnInit(): void {
    this.init()
  }
}

/** What draws which of the two it is: it says the state only. */
@Directive({ selector: "[kpPasswordInputIndicator]" })
export class KpPasswordInputIndicator implements OnInit {
  private readonly init = part("indicator")

  ngOnInit(): void {
    this.init()
  }
}
