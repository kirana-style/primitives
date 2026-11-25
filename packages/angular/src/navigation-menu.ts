import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type { NavigationMenu, NavigationMenuItem } from "@kirana-ui/core/navigation-menu"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, KpPositioner, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kpNavigationMenu]", exportAs: "kpNavigationMenu" })
export class KpNavigationMenu<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  readonly delay = input<number>()
  readonly closeDelay = input<number>()
  readonly orientation = input<Orientation>()
  readonly kpId = input<string>()
  readonly valueChanged = output<{ value: Value | null; details: ChangeDetails }>()

  controller!: NavigationMenu<Value>
  private readonly around = inject(KP_DIRECTION, { optional: true })
  // Inside another's content, it is nested.
  private readonly outer = inject(KpNavigationMenu, { optional: true, skipSelf: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
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

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createNavigationMenu(this.props(), {
      direction: this.around?.direction,
      parent: this.outer?.controller,
    })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

function part(name: "list" | "popup" | "viewport" | "arrow" | "backdrop") {
  const root = inject(KpNavigationMenu)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpNavigationMenuList]" })
export class KpNavigationMenuList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

/** On an item's `<li>`. `value` tells it from the others; an item that is given none makes its own. */
@Directive({ selector: "[kpNavigationMenuItem]" })
export class KpNavigationMenuItem implements OnInit {
  readonly value = input<unknown>()
  readonly root = inject(KpNavigationMenu)
  item!: NavigationMenuItem
  private readonly generated = inject(KpIds).make()
  private readonly mount = mounted()

  ngOnInit(): void {
    const value = this.value()
    this.item = this.root.controller.item(value === undefined ? this.generated : value)
    this.mount(this.item)
  }
}

function useItem(): () => NavigationMenuItem {
  const owner = inject(KpNavigationMenuItem)
  return () => owner.item
}

@Directive({ selector: "[kpNavigationMenuTrigger]" })
export class KpNavigationMenuTrigger implements OnInit {
  /** The trigger cannot be pressed, and the pointer resting on it shows nothing. */
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly item = useItem()
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.item().triggerPart(() => options.get()))
  }
}

@Directive({ selector: "[kpNavigationMenuIcon]" })
export class KpNavigationMenuIcon implements OnInit {
  private readonly item = useItem()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.item().icon)
  }
}

/**
 * `<div *kpNavigationMenuContent>`: an item's content, drawn in `kpNavigationMenuViewport`
 * while it is shown.
 */
@Directive({ selector: "[kpNavigationMenuContent]" })
export class KpNavigationMenuContent implements OnInit {
  private readonly item = useItem()
  private readonly root = inject(KpNavigationMenu)
  private readonly present = presentWhile({
    into: () => this.root.controller.viewportElement.peek(),
  })

  ngOnInit(): void {
    const item = this.item()
    const viewport = this.root.controller.viewportElement
    this.present(() => item.mounted.get() && viewport.get() !== undefined, item.content)
  }
}

@Directive({ selector: "[kpNavigationMenuLink]" })
export class KpNavigationMenuLink implements OnInit {
  /** The link is the page the reader is on. */
  readonly active = input(false, { transform: booleanAttribute })
  /** Whether following it closes the menu. Default: it does. */
  readonly closeOnSelect = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /** @deprecated Use `[closeOnSelect]`, which wins when both are given. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  private readonly root = inject(KpNavigationMenu)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    active: this.active(),
    closeOnSelect: this.closeOnSelect(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.link(() => defined(options.get())))
  }
}

@Directive({ selector: "[kpNavigationMenuPortal]" })
export class KpNavigationMenuPortal implements OnInit {
  private readonly root = inject(KpNavigationMenu)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kpNavigationMenuPositioner]" })
export class KpNavigationMenuPositioner extends KpPositioner {
  private readonly root = inject(KpNavigationMenu)

  protected placed() {
    return this.root.controller
  }
}

@Directive({ selector: "[kpNavigationMenuPopup]" })
export class KpNavigationMenuPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpNavigationMenuViewport]" })
export class KpNavigationMenuViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpNavigationMenuArrow]" })
export class KpNavigationMenuArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpNavigationMenuBackdrop]" })
export class KpNavigationMenuBackdrop implements OnInit {
  private readonly init = part("backdrop")

  ngOnInit(): void {
    this.init()
  }
}
