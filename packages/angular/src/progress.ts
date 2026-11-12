import { DestroyRef, Directive, ElementRef, inject, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createProgress } from "@kirana-ui/core/progress"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"

import { KuiIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kuiProgress]", exportAs: "kuiProgress" })
export class KuiProgress implements OnInit {
  readonly value = input.required<number | null>()
  readonly min = input<number>()
  readonly max = input<number>()
  readonly format = input<Intl.NumberFormatOptions>()
  readonly locale = input<string>()
  readonly getAriaValueText = input<ValueBarProps["getAriaValueText"]>()
  readonly kuiId = input<string>()

  controller!: ValueBar
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    min: this.min(),
    max: this.max(),
    format: this.format(),
    locale: this.locale(),
    getAriaValueText: this.getAriaValueText(),
  }))
  private readonly part = hostPart()

  ngOnInit(): void {
    this.controller = createProgress(this.props())
    this.part(this.controller.root)
  }
}

function part(name: "track" | "indicator" | "label") {
  const root = inject(KuiProgress)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiProgressTrack]" })
export class KuiProgressTrack implements OnInit {
  private readonly init = part("track")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiProgressIndicator]" })
export class KuiProgressIndicator implements OnInit {
  private readonly init = part("indicator")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiProgressLabel]" })
export class KuiProgressLabel implements OnInit {
  private readonly init = part("label")

  ngOnInit(): void {
    this.init()
  }
}

/** Shows the written value. */
@Directive({ selector: "[kuiProgressValue]" })
export class KuiProgressValue implements OnInit {
  private readonly root = inject(KuiProgress)
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
