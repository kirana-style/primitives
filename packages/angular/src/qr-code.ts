import { Directive, inject, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode, QrCorrection } from "@kirana-ui/core/qr-code"

import { KuiIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kuiQrCode]", exportAs: "kuiQrCode" })
export class KuiQrCode implements OnInit {
  /** What the code says: a link, a text. */
  readonly value = input("")
  readonly correction = input<QrCorrection>()
  readonly kuiId = input<string>()

  controller!: QrCode
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    correction: this.correction(),
  }))

  ngOnInit(): void {
    this.controller = createQrCode(this.props())
    this.put(this.controller.root)
  }
}

/** `<svg kuiQrCodeFrame>`: the drawing. */
@Directive({ selector: "[kuiQrCodeFrame]" })
export class KuiQrCodeFrame implements OnInit {
  private readonly root = inject(KuiQrCode)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.frame)
  }
}

/** `<svg:path kuiQrCodePattern>`: the dark modules. */
@Directive({ selector: "[kuiQrCodePattern]" })
export class KuiQrCodePattern implements OnInit {
  private readonly root = inject(KuiQrCode)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.pattern)
  }
}
