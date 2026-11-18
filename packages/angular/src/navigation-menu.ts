import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type { NavigationMenu, NavigationMenuItem } from "@kirana-ui/core/navigation-menu"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, KuiPositioner, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiNavigationMenu]", exportAs: "kuiNavigationMenu" })
export class KuiNavigationMenu<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  readonly delay = input<number>()
  readonly closeDelay = input<number>()
  readonly orientation = input<Orientation>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: Value | null; details: ChangeDetails }>()

  controller!: NavigationMenu<Value>
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    delay: this.delay(),
    closeDelay: this.closeDelay(),
    orientation: this.orientation(),
    onValueChange: (value: Value | null, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))

  ngOnInit(): void {
    this.controller = createNavigationMenu(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "list" | "popup" | "viewport" | "arrow" | "backdrop") {
  const root = inject(KuiNavigationMenu)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiNavigationMenuList]" })
export class KuiNavigationMenuList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

/** On an item's `<li>`. `value` tells it from the others; an item that is given none makes its own. */
@Directive({ selector: "[kuiNavigationMenuItem]" })
export class KuiNavigationMenuItem implements OnInit {
  readonly value = input<unknown>()
  readonly root = inject(KuiNavigationMenu)
  item!: NavigationMenuItem
  private readonly generated = inject(KuiIds).make()
  private readonly mount = mounted()

  ngOnInit(): void {
    const value = this.value()
    this.item = this.root.controller.item(value === undefined ? this.generated : value)
    this.mount(this.item)
  }
}

function useItem(): () => NavigationMenuItem {
  const owner = inject(KuiNavigationMenuItem)
  return () => owner.item
}

@Directive({ selector: "[kuiNavigationMenuTrigger]" })
export class KuiNavigationMenuTrigger implements OnInit {
  private readonly item = useItem()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.item().trigger)
  }
}

@Directive({ selector: "[kuiNavigationMenuIcon]" })
export class KuiNavigationMenuIcon implements OnInit {
  private readonly item = useItem()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.item().icon)
  }
}

/**
 * `<div *kuiNavigationMenuContent>`: an item's content, drawn in `kuiNavigationMenuViewport`
 * while it is shown.
 */
@Directive({ selector: "[kuiNavigationMenuContent]" })
export class KuiNavigationMenuContent implements OnInit {
  private readonly item = useItem()
  private readonly root = inject(KuiNavigationMenu)
  private readonly present = presentWhile({
    into: () => this.root.controller.viewportElement.peek(),
  })

  ngOnInit(): void {
    const item = this.item()
    const viewport = this.root.controller.viewportElement
    this.present(() => item.mounted.get() && viewport.get() !== undefined, item.content)
  }
}

@Directive({ selector: "[kuiNavigationMenuLink]" })
export class KuiNavigationMenuLink implements OnInit {
  /** The link is the page the reader is on. */
  readonly active = input(false, { transform: booleanAttribute })
  /** Whether following it closes the menu. Default: it does. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  private readonly root = inject(KuiNavigationMenu)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    active: this.active(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.link(() => defined(options.get())))
  }
}

@Directive({ selector: "[kuiNavigationMenuPortal]" })
export class KuiNavigationMenuPortal implements OnInit {
  private readonly root = inject(KuiNavigationMenu)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kuiNavigationMenuPositioner]" })
export class KuiNavigationMenuPositioner extends KuiPositioner {
  private readonly root = inject(KuiNavigationMenu)

  protected placed() {
    return this.root.controller
  }
}

@Directive({ selector: "[kuiNavigationMenuPopup]" })
export class KuiNavigationMenuPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiNavigationMenuViewport]" })
export class KuiNavigationMenuViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiNavigationMenuArrow]" })
export class KuiNavigationMenuArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiNavigationMenuBackdrop]" })
export class KuiNavigationMenuBackdrop implements OnInit {
  private readonly init = part("backdrop")

  ngOnInit(): void {
    this.init()
  }
}
