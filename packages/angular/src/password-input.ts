import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails, StateOf } from "@kirana-ui/core"
import { createPasswordInput } from "@kirana-ui/core/password-input"
import type { PasswordInput, PasswordInputProps } from "@kirana-ui/core/password-input"
import type { Vocabulary } from "@kirana-ui/core/vocabulary"

import { KP_FIELD } from "./field-token"
import { hostPart, inputsSignal, mounted, statePart } from "./runtime"

type Parts = Vocabulary["passwordInput"]

/**
 * On the element that holds the password's parts. `[(visible)]` is whether the password can be
 * read. Its value is the input's own (`[value]`, `ngModel`). `state()` is its state, for the
 * template (`#password="kpPasswordInput"`).
 */
@Directive({ selector: "[kpPasswordInput]", exportAs: "kpPasswordInput" })
export class KpPasswordInput implements OnInit {
  readonly visible = model<boolean | undefined>(undefined)
  readonly defaultVisible = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /**
   * What the toggle is called, for assistive technology: `show` while the password is hidden,
   * `hide` while it is shown. Default: `"Show password"` and `"Hide password"`. An `aria-label`
   * on the toggle itself wins over both.
   */
  readonly toggleLabels = input<PasswordInputProps["toggleLabels"]>()
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
    toggleLabels: this.toggleLabels(),
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
  private readonly part = statePart<StateOf<Parts["root"]>>()
  /** The root's state, as its `data-*` attributes say it: `state().visible`. */
  readonly state = this.part.state
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

/** `<input kpPasswordInputInput>`: a password, or text while it is shown. */
@Directive({ selector: "[kpPasswordInputInput]" })
export class KpPasswordInputInput implements OnInit {
  private readonly root = inject(KpPasswordInput)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.input)
  }
}

/**
 * Shows the password, and hides it again: named by the root's `toggleLabels`, or by its own
 * `aria-label`. `state()` is its state, for the template (`#toggle="kpPasswordInputToggle"`).
 */
@Directive({ selector: "[kpPasswordInputToggle]", exportAs: "kpPasswordInputToggle" })
export class KpPasswordInputToggle implements OnInit {
  private readonly root = inject(KpPasswordInput)
  private readonly put = statePart<StateOf<Parts["toggle"]>>()
  /** The toggle's state, as its `data-*` attributes say it: `state().visible`. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.toggle)
  }
}

/**
 * What draws which of the two it is: it says the state only. `state()` is that state, for the
 * template: `<span kpPasswordInputIndicator #eye="kpPasswordInputIndicator">`, then
 * `@if (eye.state().visible) { … }`.
 */
@Directive({ selector: "[kpPasswordInputIndicator]", exportAs: "kpPasswordInputIndicator" })
export class KpPasswordInputIndicator implements OnInit {
  private readonly root = inject(KpPasswordInput)
  private readonly put = statePart<StateOf<Parts["indicator"]>>()
  /** The indicator's state, as its `data-*` attributes say it: `state().visible`. */
  readonly state = this.put.state

  ngOnInit(): void {
    this.put(this.root.controller.indicator)
  }
}
