import { Directive, booleanAttribute, inject, input, numberAttribute, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createResizable } from "@kirana-ui/core/resizable"
import type { Resizable } from "@kirana-ui/core/resizable"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kuiResizableGroup]", exportAs: "kuiResizableGroup" })
export class KuiResizableGroup implements OnInit {
  readonly orientation = input<Orientation>()
  readonly keyboardStep = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  /** Each panel's share as the panels are resized, with why. */
  readonly sizesChanged = output<{ sizes: number[]; details: ChangeDetails }>()

  controller!: Resizable
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    orientation: this.orientation(),
    keyboardStep: this.keyboardStep(),
    disabled: this.disabled(),
    onSizesChange: (sizes: number[], details: ChangeDetails) =>
      this.sizesChanged.emit({ sizes, details }),
  }))

  ngOnInit(): void {
    this.controller = createResizable(this.props(), { direction: this.around?.direction })
    this.put(this.controller.group)
  }
}

@Directive({ selector: "[kuiResizablePanel]" })
export class KuiResizablePanel implements OnInit {
  readonly defaultSize = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly minSize = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly maxSize = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  private readonly root = inject(KuiResizableGroup)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    defaultSize: this.defaultSize(),
    minSize: this.minSize(),
    maxSize: this.maxSize(),
  }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.panel(() => defined(options.get())))
  }
}

@Directive({ selector: "[kuiResizableHandle]" })
export class KuiResizableHandle implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = inject(KuiResizableGroup)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.handle(() => defined(options.get())))
  }
}
