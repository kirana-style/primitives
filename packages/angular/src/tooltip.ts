import {
  Directive,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  untracked,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { Align, ChangeDetails, Side } from "@kirana-ui/core"
import { createTooltip } from "@kirana-ui/core/tooltip"
import type { HoverPopup } from "@kirana-ui/core/tooltip"

import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** On any element, or on `<ng-container>` to draw none. */
@Directive({ selector: "[kuiTooltip]", exportAs: "kuiTooltip" })
export class KuiTooltip implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly delay = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly closeDelay = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: HoverPopup
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    delay: this.delay(),
    closeDelay: this.closeDelay(),
    disabled: this.disabled(),
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) {
        this.open.set(open)
        this.props.sync()
      }
    },
  }))
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createTooltip(this.props())
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiTooltipPortal]" })
export class KuiTooltipPortal implements OnInit {
  private readonly root = inject(KuiTooltip)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kuiTooltipPositioner]" })
export class KuiTooltipPositioner implements OnInit {
  readonly side = input<Side>()
  readonly align = input<Align>()
  readonly sideOffset = input<number>()
  readonly alignOffset = input<number>()
  readonly collisionPadding = input<number>()
  private readonly root = inject(KuiTooltip)
  private readonly put = hostPart()
  private readonly options = () =>
    defined({
      side: this.side(),
      align: this.align(),
      sideOffset: this.sideOffset(),
      alignOffset: this.alignOffset(),
      collisionPadding: this.collisionPadding(),
    })

  constructor() {
    effect(() => {
      const next = this.options()
      untracked(() => this.root.controller?.positioning.set(next))
    })
  }

  ngOnInit(): void {
    // Before the element attaches: the first placement reads these.
    this.root.controller.positioning.set(untracked(this.options))
    this.put(this.root.controller.positioner)
  }
}

function part(name: "trigger" | "popup" | "arrow") {
  const root = inject(KuiTooltip)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiTooltipTrigger]" })
export class KuiTooltipTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiTooltipPopup]" })
export class KuiTooltipPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiTooltipArrow]" })
export class KuiTooltipArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}
