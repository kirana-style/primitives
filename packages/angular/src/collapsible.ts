import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { computed } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createCollapsible } from "@kirana-ui/core/collapsible"
import type { Collapsible } from "@kirana-ui/core/collapsible"

import { KpIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kpCollapsible]", exportAs: "kpCollapsible" })
export class KpCollapsible implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Collapsible
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) {
        this.open.set(open)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createCollapsible(this.props())
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kpCollapsibleTrigger]" })
export class KpCollapsibleTrigger implements OnInit {
  private readonly root = inject(KpCollapsible)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.trigger)
  }
}

/** `<div *kpCollapsiblePanel>`: in the page while open; `{ keepMounted: true }` keeps it, hidden. */
@Directive({ selector: "[kpCollapsiblePanel]" })
export class KpCollapsiblePanel implements OnInit {
  /**
   * Its options: `{ keepMounted: true }` keeps the panel in the page, hidden, while it is closed.
   */
  readonly kpCollapsiblePanel = input<{ keepMounted?: boolean } | "">("")
  private readonly root = inject(KpCollapsible)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const options = this.kpCollapsiblePanel()
    const keep = typeof options === "object" && options.keepMounted === true
    const { mounted: inPage, panel } = this.root.controller
    this.present(keep ? computed(() => true) : inPage, panel)
  }
}
