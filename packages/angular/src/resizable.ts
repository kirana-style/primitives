import { Directive, booleanAttribute, inject, input, numberAttribute, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createResizable } from "@kirana-ui/core/resizable"
import type { Resizable } from "@kirana-ui/core/resizable"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kpResizableGroup]", exportAs: "kpResizableGroup" })
export class KpResizableGroup implements OnInit {
  readonly orientation = input<Orientation>()
  readonly keyboardStep = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  /** Each panel's share as the panels are resized, with why. */
  readonly sizesChanged = output<{ sizes: number[]; details: ChangeDetails }>()

  controller!: Resizable
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    orientation: this.orientation(),
    keyboardStep: this.keyboardStep(),
    disabled: this.disabled(),
    onSizesChange: (sizes: number[], details: ChangeDetails) =>
      this.sizesChanged.emit({ sizes, details }),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createResizable(this.props(), { direction: this.around?.direction })
    this.put(this.controller.group)
  }
}

@Directive({ selector: "[kpResizablePanel]" })
export class KpResizablePanel implements OnInit {
  readonly defaultSize = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly minSize = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly maxSize = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  private readonly root = inject(KpResizableGroup)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    defaultSize: this.defaultSize(),
    minSize: this.minSize(),
    maxSize: this.maxSize(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.panel(() => defined(options.get())))
  }
}

@Directive({ selector: "[kpResizableHandle]" })
export class KpResizableHandle implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = inject(KpResizableGroup)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.handle(() => defined(options.get())))
  }
}
