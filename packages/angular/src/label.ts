import { Directive, inject } from "@angular/core"
import type { OnInit } from "@angular/core"
import { createLabel } from "@kirana-ui/core/label"

import { KP_FIELD } from "./field-token"
import { hostPart } from "./runtime"

/** `<label kpLabel>`. Inside a `kpField` it is the field's label. */
@Directive({ selector: "[kpLabel]", exportAs: "kpLabel" })
export class KpLabel implements OnInit {
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(createLabel({ field: this.field?.controller }).label)
  }
}
