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
import { createHoverCard } from "@kirana-ui/core/hover-card"
import type { HoverPopup } from "@kirana-ui/core/hover-card"

import { KpIds, KpPositioner, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** On any element, or on `<ng-container>` to draw none. */
@Directive({ selector: "[kpHoverCard]", exportAs: "kpHoverCard" })
export class KpHoverCard implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly delay = input<number | undefined, unknown>(undefined, { transform: numberAttribute })
  readonly closeDelay = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: HoverPopup
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
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

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createHoverCard(this.props())
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kpHoverCardPortal]" })
export class KpHoverCardPortal implements OnInit {
  private readonly root = inject(KpHoverCard)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kpHoverCardPositioner]" })
export class KpHoverCardPositioner extends KpPositioner {
  private readonly root = inject(KpHoverCard)

  protected placed() {
    return this.root.controller
  }
}

function part(name: "popup" | "arrow") {
  const root = inject(KpHoverCard)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpHoverCardTrigger]" })
export class KpHoverCardTrigger implements OnInit {
  /** Its own waits, which come before the root's. */
  readonly delay = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  readonly closeDelay = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  })
  private readonly root = inject(KpHoverCard)
  private readonly put = hostPart()

  constructor() {
    effect(() => {
      const timing = defined({ delay: this.delay(), closeDelay: this.closeDelay() })
      untracked(() => this.root.controller?.timing.set(timing))
    })
  }

  ngOnInit(): void {
    this.root.controller.timing.set(defined({ delay: this.delay(), closeDelay: this.closeDelay() }))
    this.put(this.root.controller.trigger)
  }
}

@Directive({ selector: "[kpHoverCardPopup]" })
export class KpHoverCardPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpHoverCardArrow]" })
export class KpHoverCardArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}
