import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
  numberAttribute,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp, OtpProps, OtpSlot } from "@kirana-ui/core/otp"

import { KP_FIELD } from "./field-token"
import { KpIds, hostPart, inputsSignal, onServer, presentWhile } from "./runtime"

@Directive({ selector: "[kpOtp]", exportAs: "kpOtp" })
export class KpOtp implements OnInit {
  readonly length = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly value = model<string | undefined>(undefined)
  readonly defaultValue = input<string>()
  readonly validationType = input<OtpProps["validationType"]>()
  /**
   * What a character may be.
   * @deprecated Use `validationType`, which wins when both are given.
   */
  readonly mode = input<OtpProps["mode"]>()
  readonly pattern = input<string>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** Shown as it is, focusable, not changeable. */
  readonly readOnly = input(false, { transform: booleanAttribute })
  /** Needed: in a field, an empty code is then invalid. */
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the input belongs to, when it is not inside it. */
  readonly form = input<string>()
  /** The id of its input, not of the root, unless the input is given its own: a `<label for>` names it. */
  readonly kpId = input<string>()
  readonly valueChanged = output<{ value: string; details: ChangeDetails }>()
  /** Every character is in: the moment to send the code, with the change's details. */
  readonly valueCompleted = output<{ value: string; details: ChangeDetails }>()
  /**
   * Every character is in.
   * @deprecated Use `valueCompleted`, which carries the details too. Both are
   * emitted: an output cannot tell whether it is bound.
   */
  readonly completed = output<string>()

  controller!: Otp
  private readonly generated = inject(KpIds).make()
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    length: this.length(),
    value: this.value(),
    defaultValue: this.defaultValue(),
    validationType: this.validationType(),
    mode: this.mode(),
    pattern: this.pattern(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: string, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onValueComplete: (value: string, details: ChangeDetails) => {
      this.valueCompleted.emit({ value, details })
      this.completed.emit(value)
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createOtp(this.props(), { field: this.field?.controller })
    this.put(this.controller.root)
  }
}

function part(name: "input" | "group" | "separator") {
  const root = inject(KpOtp)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** `<input kpOtpInput>`: the one input the code is typed in. */
@Directive({ selector: "input[kpOtpInput]" })
export class KpOtpInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpOtpGroup]" })
export class KpOtpGroup implements OnInit {
  private readonly init = part("group")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpOtpSeparator]" })
export class KpOtpSeparator implements OnInit {
  private readonly init = part("separator")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * One cell. It writes its character before whatever is inside it (a caret), and leaves that
 * alone.
 */
@Directive({ selector: "[kpOtpSlot]" })
export class KpOtpSlot implements OnInit {
  readonly index = input.required<number, unknown>({ transform: numberAttribute })
  readonly root = inject(KpOtp)
  slot!: OtpSlot
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly put = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    this.slot = this.root.controller.slot(this.index())
    this.put(this.slot.part)
    const text = this.element.ownerDocument.createTextNode(this.slot.char.peek())
    // Before whatever the cell holds; a server's document has no `prepend`.
    this.element.insertBefore(text, this.element.firstChild)
    if (this.server) return
    this.destroy.onDestroy(
      effect(() => {
        text.data = this.slot.char.get()
      })
    )
  }
}

/** `<div *kpOtpCaret>`: in its cell while the cell is the active one and empty. */
@Directive({ selector: "[kpOtpCaret]" })
export class KpOtpCaret implements OnInit {
  private readonly owner = inject(KpOtpSlot)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.owner.slot.caret, this.owner.root.controller.caretPart)
  }
}
