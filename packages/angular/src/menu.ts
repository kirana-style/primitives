import {
  Directive,
  HostAttributeToken,
  InjectionToken,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  untracked,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { Align, ChangeDetails, Side } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type { Menu, MenuCheckboxItem, MenuGroup, MenuRadioGroup } from "@kirana-ui/core/menu"
import { createMenubar } from "@kirana-ui/core/menubar"
import type { Menubar } from "@kirana-ui/core/menubar"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** The menu a part is in: the root's, or a submenu's. */
const KUI_MENU = new InjectionToken<{ controller: Menu }>("KuiMenu")

/** The bar a menu is one of the menus of, if it is in one. */
const KUI_MENUBAR = new InjectionToken<{ controller: Menubar } | null>("KuiMenubar")

/** What a menu and a submenu share: their inputs, read into the core. */
@Directive()
abstract class MenuRoot implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Menu
  protected abstract readonly parent: { controller: Menu } | null
  protected readonly bar: { controller: Menubar } | null = null
  protected readonly context: boolean = false
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    loop: this.loop(),
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
    this.controller = createMenu(this.props(), {
      parent: this.parent?.controller,
      direction: this.around?.direction,
      menubar: this.bar?.controller,
      context: this.context,
    })
    this.mount(this.controller)
  }
}

/**
 * `kuiContextMenu` in place of `kuiMenu` is a menu for an area of the page, opened at the
 * pointer: its trigger is `kuiContextMenuTrigger`, its other parts the menu's.
 */
@Directive({
  selector: "[kuiMenu],[kuiContextMenu]",
  exportAs: "kuiMenu",
  providers: [
    { provide: KUI_MENU, useExisting: forwardRef(() => KuiMenu) },
    // A menu written inside a bar's menu is not one of the bar's.
    { provide: KUI_MENUBAR, useValue: null },
  ],
})
export class KuiMenu extends MenuRoot {
  protected readonly parent = null
  protected override readonly context =
    inject(new HostAttributeToken("kuiContextMenu"), { optional: true }) !== null
  protected override readonly bar = this.context
    ? null
    : inject(KUI_MENUBAR, { optional: true, skipSelf: true })
}

/** A row of menus that work as one. Each `kuiMenu` inside it is one of its items. */
@Directive({
  selector: "[kuiMenubar]",
  exportAs: "kuiMenubar",
  providers: [{ provide: KUI_MENUBAR, useExisting: forwardRef(() => KuiMenubar) }],
})
export class KuiMenubar implements OnInit {
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()

  controller!: Menubar
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    loop: this.loop(),
    disabled: this.disabled(),
  }))

  ngOnInit(): void {
    this.controller = createMenubar(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
  }
}

/** A menu that one of this menu's items opens. Its trigger is `kuiMenuSubmenuTrigger`. */
@Directive({
  selector: "[kuiMenuSubmenuRoot]",
  exportAs: "kuiMenuSubmenuRoot",
  providers: [{ provide: KUI_MENU, useExisting: forwardRef(() => KuiMenuSubmenuRoot) }],
})
export class KuiMenuSubmenuRoot extends MenuRoot {
  protected readonly parent = inject(KUI_MENU, { skipSelf: true })
}

@Directive({ selector: "[kuiMenuPortal]" })
export class KuiMenuPortal implements OnInit {
  private readonly root = inject(KUI_MENU)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kuiMenuPositioner]" })
export class KuiMenuPositioner implements OnInit {
  readonly side = input<Side>()
  readonly align = input<Align>()
  readonly sideOffset = input<number>()
  readonly alignOffset = input<number>()
  readonly collisionPadding = input<number>()
  private readonly root = inject(KUI_MENU)
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

function part(name: "trigger" | "popup" | "arrow" | "separator" | "area") {
  const root = inject(KUI_MENU)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiMenuTrigger]" })
export class KuiMenuTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

/** The area a secondary press, or a long press on a touch screen, opens a `kuiContextMenu` in. */
@Directive({ selector: "[kuiContextMenuTrigger]" })
export class KuiContextMenuTrigger implements OnInit {
  private readonly init = part("area")

  ngOnInit(): void {
    this.init()
  }
}

/** On the item of a menu that opens the submenu around it (`kuiMenuSubmenuRoot`). */
@Directive({ selector: "[kuiMenuSubmenuTrigger]" })
export class KuiMenuSubmenuTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiMenuPopup]" })
export class KuiMenuPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiMenuArrow]" })
export class KuiMenuArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiMenuSeparator]" })
export class KuiMenuSeparator implements OnInit {
  private readonly init = part("separator")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiMenuItem]" })
export class KuiMenuItem implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What typing matches; the item's text when left out. */
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  private readonly root = inject(KUI_MENU)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    disabled: this.disabled(),
    label: this.label(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(() => defined(options.get())))
  }
}

@Directive({ selector: "[kuiMenuGroup]" })
export class KuiMenuGroup implements OnInit {
  readonly kuiId = input<string>()
  readonly menu = inject(KUI_MENU)
  group!: MenuGroup
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.menu.controller.group(this.kuiId() ?? this.generated)
    this.put(this.group.root)
  }
}

/** Names the group it is in. With no group around it, it is plain text. */
@Directive({ selector: "[kuiMenuGroupLabel]" })
export class KuiMenuGroupLabel implements OnInit {
  private readonly menu = inject(KUI_MENU)
  private readonly around = inject(KuiMenuGroup, { optional: true })
  private readonly put = hostPart()

  ngOnInit(): void {
    // A group around a submenu is not a group of the submenu's own items.
    const group = this.around?.menu === this.menu ? this.around.group : undefined
    this.put(group ? group.label : this.menu.controller.label)
  }
}

@Directive({ selector: "[kuiMenuCheckboxItem]", exportAs: "kuiMenuCheckboxItem" })
export class KuiMenuCheckboxItem implements OnInit {
  readonly checked = model<boolean | undefined>(undefined)
  readonly defaultChecked = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does not. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly checkedChanged = output<{ checked: boolean; details: ChangeDetails }>()

  item!: MenuCheckboxItem
  private readonly root = inject(KUI_MENU)
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    disabled: this.disabled(),
    label: this.label(),
    closeOnClick: this.closeOnClick(),
    onCheckedChange: (checked: boolean, details: ChangeDetails) => {
      this.checkedChanged.emit({ checked, details })
      if (!details.canceled) {
        this.checked.set(checked)
        this.props.sync()
      }
    },
  }))

  ngOnInit(): void {
    this.item = this.root.controller.checkboxItem(this.props())
    this.put(this.item.part)
  }
}

/** `<span *kuiMenuCheckboxItemIndicator>`: in the page while its item is checked. */
@Directive({ selector: "[kuiMenuCheckboxItemIndicator]" })
export class KuiMenuCheckboxItemIndicator implements OnInit {
  private readonly owner = inject(KuiMenuCheckboxItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.owner.item.checked, this.owner.item.indicator)
  }
}

@Directive({ selector: "[kuiMenuRadioGroup]", exportAs: "kuiMenuRadioGroup" })
export class KuiMenuRadioGroup implements OnInit {
  readonly value = model<unknown>(undefined)
  readonly defaultValue = input<unknown>(null)
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly valueChanged = output<{ value: unknown; details: ChangeDetails }>()

  group!: MenuRadioGroup
  private readonly root = inject(KUI_MENU)
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(() => ({
    value: this.value(),
    defaultValue: this.defaultValue(),
    disabled: this.disabled(),
    onValueChange: (value: unknown, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))

  ngOnInit(): void {
    this.group = this.root.controller.radioGroup(this.props())
    this.put(this.group.root)
    this.mount(this.group)
  }
}

@Directive({ selector: "[kuiMenuRadioItem]" })
export class KuiMenuRadioItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does not. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly owner = inject(KuiMenuRadioGroup)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    disabled: this.disabled(),
    label: this.label(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.owner.group.item(this.value(), () => defined(options.get())))
  }
}

/** `<span *kuiMenuRadioItemIndicator>`: in the page while its item is the chosen one. */
@Directive({ selector: "[kuiMenuRadioItemIndicator]" })
export class KuiMenuRadioItemIndicator implements OnInit {
  private readonly item = inject(KuiMenuRadioItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { group } = this.item.owner
    const value = this.item.value()
    this.present(group.checked(value), group.indicator(value))
  }
}
