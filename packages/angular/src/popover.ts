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
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createPopover } from "@kirana-ui/core/popover"
import type { Popover } from "@kirana-ui/core/popover"

import { KuiIds, KuiPositioner, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** `modal` as an attribute writes it: there or not, or `"trap-focus"`. */
const modalAttribute = (value: unknown): boolean | "trap-focus" =>
  value === "trap-focus" ? value : booleanAttribute(value)

@Directive({ selector: "[kuiPopover]", exportAs: "kuiPopover" })
export class KuiPopover implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  /**
   * What the page behind it may do while it is open. `false` (the default): everything.
   * `true`: nothing, the page is inert and does not scroll, and Tab stays inside the popover.
   * `"trap-focus"`: Tab stays inside the popover, and the page can still be pressed and
   * scrolled. A popover the pointer opened holds nothing until it is pressed. Read as it opens.
   */
  readonly modal = input<boolean | "trap-focus", unknown>(false, { transform: modalAttribute })
  readonly kuiId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Popover
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    modal: this.modal(),
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) {
        this.open.set(open)
        this.props.sync()
      }
    },
  }))
  private readonly mount = mounted()

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

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
export class KuiPopoverPositioner extends KuiPositioner {
  private readonly root = inject(KuiPopover)

  protected placed() {
    return this.root.controller
  }
}

function part(name: "backdrop" | "popup" | "arrow" | "title" | "description" | "close") {
  const root = inject(KuiPopover)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiPopoverTrigger]" })
export class KuiPopoverTrigger implements OnInit {
  /**
   * Whether the pointer resting on the trigger opens the popover too. A press and the keyboard
   * still open it, and a press on one the pointer opened keeps it open. Default `false`.
   */
  readonly openOnHover = input(false, { transform: booleanAttribute })
  /** How long the pointer rests on the trigger before the popover opens, in milliseconds. Default 300. */
  readonly delay = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  /** How long after the pointer leaves a popover it opened closes, in milliseconds. Default 0. */
  readonly closeDelay = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  private readonly root = inject(KuiPopover)
  private readonly put = hostPart()
  private readonly options = () =>
    defined({
      openOnHover: this.openOnHover(),
      delay: this.delay(),
      closeDelay: this.closeDelay(),
    })

  constructor() {
    effect(() => {
      const hovering = this.options()
      untracked(() => this.root.controller?.hovering.set(hovering))
    })
  }

  ngOnInit(): void {
    this.root.controller.hovering.set(untracked(this.options))
    this.put(this.root.controller.trigger)
  }
}

@Directive({ selector: "[kuiPopoverBackdrop]" })
export class KuiPopoverBackdrop implements OnInit {
  private readonly init = part("backdrop")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiPopoverArrow]" })
export class KuiPopoverArrow implements OnInit {
  private readonly init = part("arrow")

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
