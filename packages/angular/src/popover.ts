import {
  Directive,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { Align, ChangeDetails, Side } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover } from "@kirana-ui/core/popover"

import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiPopover]", exportAs: "kuiPopover" })
export class KuiPopover implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Popover
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
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
    this.controller = createPopover(this.props())
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiPopoverPortal]" })
export class KuiPopoverPortal implements OnInit {
  private readonly root = inject(KuiPopover)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kuiPopoverPositioner]" })
export class KuiPopoverPositioner implements OnInit {
  readonly side = input<Side>()
  readonly align = input<Align>()
  readonly sideOffset = input<number>()
  readonly alignOffset = input<number>()
  readonly collisionPadding = input<number>()
  private readonly root = inject(KuiPopover)
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

function part(name: "trigger" | "popup" | "title" | "description" | "close") {
  const root = inject(KuiPopover)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiPopoverTrigger]" })
export class KuiPopoverTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiPopoverPopup]" })
export class KuiPopoverPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiPopoverTitle]" })
export class KuiPopoverTitle implements OnInit {
  private readonly init = part("title")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiPopoverDescription]" })
export class KuiPopoverDescription implements OnInit {
  private readonly init = part("description")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiPopoverClose]" })
export class KuiPopoverClose implements OnInit {
  private readonly init = part("close")

  ngOnInit(): void {
    this.init()
  }
}
