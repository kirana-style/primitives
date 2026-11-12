import { Directive, booleanAttribute, inject, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import { createFieldset } from "@kirana-ui/core/fieldset"
import type { Fieldset } from "@kirana-ui/core/fieldset"

import { KuiIds, hostPart, inputsSignal, mounted } from "./runtime"

@Directive({ selector: "[kuiFieldset]", exportAs: "kuiFieldset" })
export class KuiFieldset implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()

  controller!: Fieldset
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    disabled: this.disabled(),
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createFieldset(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiFieldsetLegend]" })
export class KuiFieldsetLegend implements OnInit {
  private readonly root = inject(KuiFieldset)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.legend)
  }
}
