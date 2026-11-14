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
import type { OnInit } from "@angular/core"
import { effect } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createOtp } from "@kirana-ui/core/otp"
import type { Otp, OtpProps, OtpSlot } from "@kirana-ui/core/otp"

import { KuiIds, hostPart, inputsSignal, onServer, presentWhile } from "./runtime"

@Directive({ selector: "[kuiOtp]", exportAs: "kuiOtp" })
export class KuiOtp implements OnInit {
  readonly length = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly value = model<string | undefined>(undefined)
  readonly defaultValue = input<string>()
  readonly mode = input<OtpProps["mode"]>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the input belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: string; details: ChangeDetails }>()
  /** Every character is in: the moment to send the code. */
  readonly completed = output<string>()

  controller!: Otp
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    length: this.length(),
    value: this.value(),
    defaultValue: this.defaultValue(),
    mode: this.mode(),
    disabled: this.disabled(),
    name: this.name(),
    form: this.form(),
    onValueChange: (value: string, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onComplete: (value: string) => this.completed.emit(value),
  }))

  ngOnInit(): void {
    this.controller = createOtp(this.props())
    this.put(this.controller.root)
  }
}

function part(name: "input" | "group" | "separator") {
  const root = inject(KuiOtp)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** `<input kuiOtpInput>`: the one input the code is typed in. */
@Directive({ selector: "input[kuiOtpInput]" })
export class KuiOtpInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiOtpGroup]" })
export class KuiOtpGroup implements OnInit {
  private readonly init = part("group")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiOtpSeparator]" })
export class KuiOtpSeparator implements OnInit {
  private readonly init = part("separator")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * One cell. It writes its character before whatever is inside it (a caret), and leaves that
 * alone.
 */
@Directive({ selector: "[kuiOtpSlot]" })
export class KuiOtpSlot implements OnInit {
  readonly index = input.required<number, unknown>({ transform: numberAttribute })
  readonly root = inject(KuiOtp)
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

/** `<div *kuiOtpCaret>`: in its cell while the cell is the active one and empty. */
@Directive({ selector: "[kuiOtpCaret]" })
export class KuiOtpCaret implements OnInit {
  private readonly owner = inject(KuiOtpSlot)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.owner.slot.caret, this.owner.root.controller.caretPart)
  }
}
