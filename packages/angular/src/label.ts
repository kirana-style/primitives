import { Directive, inject } from "@angular/core"
import type { OnInit } from "@angular/core"
import { createLabel } from "@kirana-ui/core/label"

import { KUI_FIELD } from "./field-token"
import { hostPart } from "./runtime"

/** `<label kuiLabel>`. Inside a `kuiField` it is the field's label. */
@Directive({ selector: "[kuiLabel]", exportAs: "kuiLabel" })
export class KuiLabel implements OnInit {
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(createLabel({ field: this.field?.controller }).label)
  }
}
