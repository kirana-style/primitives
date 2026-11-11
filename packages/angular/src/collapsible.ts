import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import { computed } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible } from "@kirana-ui/core/collapsible"

import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiCollapsible]", exportAs: "kuiCollapsible" })
export class KuiCollapsible implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Collapsible
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) this.open.set(open)
    },
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createCollapsible(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiCollapsibleTrigger]" })
export class KuiCollapsibleTrigger implements OnInit {
  private readonly root = inject(KuiCollapsible)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.trigger)
  }
}

/** `<div *kuiCollapsiblePanel>`: in the page while open; `{ keepMounted: true }` keeps it, hidden. */
@Directive({ selector: "[kuiCollapsiblePanel]" })
export class KuiCollapsiblePanel implements OnInit {
  readonly kuiCollapsiblePanel = input<{ keepMounted?: boolean } | "">("")
  private readonly root = inject(KuiCollapsible)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const options = this.kuiCollapsiblePanel()
    const keep = typeof options === "object" && options.keepMounted === true
    const { mounted: inPage, panel } = this.root.controller
    this.present(keep ? computed(() => true) : inPage, panel)
  }
}
