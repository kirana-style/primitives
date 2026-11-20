import { DestroyRef, Directive, ElementRef, inject, input } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createMeter } from "@kirana-ui/core/meter"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/meter"

import { KpIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kpMeter]", exportAs: "kpMeter" })
export class KpMeter implements OnInit {
  readonly value = input.required<number>()
  readonly min = input<number>()
  readonly max = input<number>()
  readonly format = input<Intl.NumberFormatOptions>()
  readonly locale = input<string>()
  readonly getAriaValueText = input<ValueBarProps["getAriaValueText"]>()
  readonly kpId = input<string>()

  controller!: ValueBar
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    min: this.min(),
    max: this.max(),
    format: this.format(),
    locale: this.locale(),
    getAriaValueText: this.getAriaValueText(),
  }))
  private readonly part = hostPart()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createMeter(this.props())
    this.part(this.controller.root)
  }
}

function part(name: "track" | "indicator" | "label") {
  const root = inject(KpMeter)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpMeterTrack]" })
export class KpMeterTrack implements OnInit {
  private readonly init = part("track")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMeterIndicator]" })
export class KpMeterIndicator implements OnInit {
  private readonly init = part("indicator")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMeterLabel]" })
export class KpMeterLabel implements OnInit {
  private readonly init = part("label")

  ngOnInit(): void {
    this.init()
  }
}

/** Shows the written value. */
@Directive({ selector: "[kpMeterValue]" })
export class KpMeterValue implements OnInit {
  private readonly root = inject(KpMeter)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.value)
    this.destroy.onDestroy(
      effect(() => {
        this.element.textContent = this.root.controller.text.get() ?? ""
      })
    )
  }
}
