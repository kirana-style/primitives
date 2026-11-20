import { Directive, inject, input } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { createQrCode } from "@kirana-ui/core/qr-code"
import type { QrCode, QrCorrection } from "@kirana-ui/core/qr-code"

import { KpIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kpQrCode]", exportAs: "kpQrCode" })
export class KpQrCode implements OnInit {
  /** What the code says: a link, a text. */
  readonly value = input("")
  readonly correction = input<QrCorrection>()
  readonly kpId = input<string>()

  controller!: QrCode
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    correction: this.correction(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createQrCode(this.props())
    this.put(this.controller.root)
  }
}

/** `<svg kpQrCodeFrame>`: the drawing. */
@Directive({ selector: "[kpQrCodeFrame]" })
export class KpQrCodeFrame implements OnInit {
  private readonly root = inject(KpQrCode)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.frame)
  }
}

/** `<svg:path kpQrCodePattern>`: the dark modules. */
@Directive({ selector: "[kpQrCodePattern]" })
export class KpQrCodePattern implements OnInit {
  private readonly root = inject(KpQrCode)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.pattern)
  }
}
