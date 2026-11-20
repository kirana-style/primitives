import { Directive, input } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { Orientation } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"

import { hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kpSeparator]", exportAs: "kpSeparator" })
export class KpSeparator implements OnInit {
  readonly orientation = input<Orientation>()
  private readonly props = inputsSignal(this, () => ({ orientation: this.orientation() }))
  private readonly part = hostPart()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.part(createSeparator(this.props()).root)
  }
}
