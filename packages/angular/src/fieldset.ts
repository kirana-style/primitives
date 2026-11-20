import { Directive, booleanAttribute, inject, input } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset } from "@kirana-ui/core/fieldset"

import { KpIds, hostPart, inputsSignal, mounted } from "./runtime"

@Directive({ selector: "[kpFieldset]", exportAs: "kpFieldset" })
export class KpFieldset implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()

  controller!: Fieldset
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    disabled: this.disabled(),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createFieldset(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kpFieldsetLegend]" })
export class KpFieldsetLegend implements OnInit {
  private readonly root = inject(KpFieldset)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.legend)
  }
}
