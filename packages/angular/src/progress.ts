import { DestroyRef, Directive, ElementRef, inject, input } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { effect } from "@kirana-ui/core"
import { createProgress } from "@kirana-ui/core/progress"
import type { ValueBar, ValueBarProps } from "@kirana-ui/core/progress"

import { KpIds, hostPart, inputsSignal, onServer, ownText } from "./runtime"

@Directive({ selector: "[kpProgress]", exportAs: "kpProgress" })
export class KpProgress implements OnInit {
  readonly value = input.required<number | null>()
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
    this.controller = createProgress(this.props())
    this.part(this.controller.root)
  }
}

function part(name: "track" | "indicator" | "label") {
  const root = inject(KpProgress)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpProgressTrack]" })
export class KpProgressTrack implements OnInit {
  private readonly init = part("track")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpProgressIndicator]" })
export class KpProgressIndicator implements OnInit {
  private readonly init = part("indicator")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpProgressLabel]" })
export class KpProgressLabel implements OnInit {
  private readonly init = part("label")

  ngOnInit(): void {
    this.init()
  }
}

/** Shows the written value, unless the element has content of its own. */
@Directive({ selector: "[kpProgressValue]" })
export class KpProgressValue implements OnInit {
  private readonly root = inject(KpProgress)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly part = hostPart()
  private readonly server = onServer()

  ngOnInit(): void {
    this.part(this.root.controller.value)
    // Content of the element's own is what it says.
    const text = ownText(this.element, this.server)
    if (!text) return
    this.destroy.onDestroy(
      effect(() => {
        text.data = this.root.controller.text.get() ?? ""
      })
    )
  }
}
