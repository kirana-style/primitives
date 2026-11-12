import { Directive, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { Orientation } from "@kirana-ui/core"
import { createSeparator } from "@kirana-ui/core/separator"

import { hostPart, inputsSignal } from "./runtime"

@Directive({ selector: "[kuiSeparator]" })
export class KuiSeparator implements OnInit {
  readonly orientation = input<Orientation>()
  private readonly props = inputsSignal(() => ({ orientation: this.orientation() }))
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(createSeparator(this.props()).root)
  }
}
