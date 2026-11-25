import {
  Directive,
  HostAttributeToken,
  InjectionToken,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createMenu } from "@kirana-ui/core/menu"
import type { Menu, MenuCheckboxItem, MenuGroup, MenuRadioGroup } from "@kirana-ui/core/menu"
import { createMenubar } from "@kirana-ui/core/menubar"
import type { Menubar } from "@kirana-ui/core/menubar"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, KpPositioner, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** The menu a part is in: the root's, or a submenu's. */
const KP_MENU = new InjectionToken<{ controller: Menu }>("KpMenu")

/** The bar a menu is one of the menus of, if it is in one. */
const KP_MENUBAR = new InjectionToken<{ controller: Menubar } | null>("KpMenubar")

/** What a menu and a submenu share: their inputs, read into the core. */
@Directive()
abstract class MenuRoot implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly loopFocus = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /**
   * Whether the arrows wrap from the last item to the first.
   * @deprecated Base UI's name is `loopFocus`, which wins when both are given.
   */
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  /** Holds the page while the menu is open. Not for a submenu. */
  readonly modal = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Menu
  protected abstract readonly parent: { controller: Menu } | null
  protected readonly bar: { controller: Menubar } | null = null
  protected readonly context: boolean = false
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    loop: this.loop(),
    loopFocus: this.loopFocus(),
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
 * `kpContextMenu` in place of `kpMenu` is a menu for an area of the page, opened at the
 * pointer: its trigger is `kpContextMenuTrigger`, its other parts the menu's.
 */
@Directive({
  selector: "[kpMenu],[kpContextMenu]",
  exportAs: "kpMenu",
  providers: [
    { provide: KP_MENU, useExisting: forwardRef(() => KpMenu) },
    // A menu written inside a bar's menu is not one of the bar's.
    { provide: KP_MENUBAR, useValue: null },
  ],
})
export class KpMenu extends MenuRoot {
  protected readonly parent = null
  protected override readonly context =
    inject(new HostAttributeToken("kpContextMenu"), { optional: true }) !== null
  protected override readonly bar = this.context
    ? null
    : inject(KP_MENUBAR, { optional: true, skipSelf: true })
}

/** A row of menus that work as one. Each `kpMenu` inside it is one of its items. */
@Directive({
  selector: "[kpMenubar]",
  exportAs: "kpMenubar",
  providers: [{ provide: KP_MENUBAR, useExisting: forwardRef(() => KpMenubar) }],
})
export class KpMenubar implements OnInit {
  readonly loopFocus = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /**
   * Whether the arrows wrap from the last item to the first.
   * @deprecated Base UI's name is `loopFocus`, which wins when both are given.
   */
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly orientation = input<Orientation>()
  /** Holds the page while one of its menus is open. Default `false`. */
  readonly modal = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()

  controller!: Menubar
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    loop: this.loop(),
    loopFocus: this.loopFocus(),
    disabled: this.disabled(),
    orientation: this.orientation(),
    modal: this.modal(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createMenubar(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
  }
}

/** A menu that one of this menu's items opens. Its trigger is `kpMenuSubmenuTrigger`. */
@Directive({
  selector: "[kpMenuSubmenuRoot]",
  exportAs: "kpMenuSubmenuRoot",
  providers: [{ provide: KP_MENU, useExisting: forwardRef(() => KpMenuSubmenuRoot) }],
})
export class KpMenuSubmenuRoot extends MenuRoot {
  protected readonly parent = inject(KP_MENU, { skipSelf: true })
}

@Directive({ selector: "[kpMenuPortal]" })
export class KpMenuPortal implements OnInit {
  private readonly root = inject(KP_MENU)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kpMenuPositioner]" })
export class KpMenuPositioner extends KpPositioner {
  private readonly root = inject(KP_MENU)

  protected placed() {
    return this.root.controller
  }
}

function part(name: "trigger" | "popup" | "arrow" | "separator" | "area") {
  const root = inject(KP_MENU)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kpMenuTrigger]" })
export class KpMenuTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

/** The area a secondary press, or a long press on a touch screen, opens a `kpContextMenu` in. */
@Directive({ selector: "[kpContextMenuTrigger]" })
export class KpContextMenuTrigger implements OnInit {
  private readonly init = part("area")

  ngOnInit(): void {
    this.init()
  }
}

/** On the item of a menu that opens the submenu around it (`kpMenuSubmenuRoot`). */
@Directive({ selector: "[kpMenuSubmenuTrigger]" })
export class KpMenuSubmenuTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMenuPopup]" })
export class KpMenuPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMenuArrow]" })
export class KpMenuArrow implements OnInit {
  private readonly init = part("arrow")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMenuSeparator]" })
export class KpMenuSeparator implements OnInit {
  private readonly init = part("separator")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpMenuItem]" })
export class KpMenuItem implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What typing matches; the item's text when left out. */
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does. */
  readonly closeOnSelect = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /** @deprecated Use `[closeOnSelect]`, which wins when both are given. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  private readonly root = inject(KP_MENU)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    label: this.label(),
    closeOnSelect: this.closeOnSelect(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(() => defined(options.get())))
  }
}

/** `<a kpMenuLinkItem href="…">`: an item that is a link. */
@Directive({ selector: "a[kpMenuLinkItem]" })
export class KpMenuLinkItem implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does. */
  readonly closeOnSelect = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /** @deprecated Use `[closeOnSelect]`, which wins when both are given. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  private readonly root = inject(KP_MENU)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    label: this.label(),
    closeOnSelect: this.closeOnSelect(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(() => defined(options.get())))
  }
}

@Directive({ selector: "[kpMenuGroup]" })
export class KpMenuGroup implements OnInit {
  readonly kpId = input<string>()
  readonly menu = inject(KP_MENU)
  group!: MenuGroup
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.menu.controller.group(this.kpId() ?? this.generated)
    this.put(this.group.root)
  }
}

/** Names the group it is in. With no group around it, it is plain text. */
@Directive({ selector: "[kpMenuGroupLabel]" })
export class KpMenuGroupLabel implements OnInit {
  private readonly menu = inject(KP_MENU)
  private readonly around = inject(KpMenuGroup, { optional: true })
  private readonly put = hostPart()

  ngOnInit(): void {
    // A group around a submenu is not a group of the submenu's own items.
    const group = this.around?.menu === this.menu ? this.around.group : undefined
    this.put(group ? group.label : this.menu.controller.label)
  }
}

@Directive({ selector: "[kpMenuCheckboxItem]", exportAs: "kpMenuCheckboxItem" })
export class KpMenuCheckboxItem implements OnInit {
  readonly checked = model<boolean | undefined>(undefined)
  readonly defaultChecked = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does not. */
  readonly closeOnSelect = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /** @deprecated Use `[closeOnSelect]`, which wins when both are given. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly checkedChanged = output<{ checked: boolean; details: ChangeDetails }>()

  item!: MenuCheckboxItem
  private readonly root = inject(KP_MENU)
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    disabled: this.disabled(),
    label: this.label(),
    closeOnSelect: this.closeOnSelect(),
    closeOnClick: this.closeOnClick(),
    onCheckedChange: (checked: boolean, details: ChangeDetails) => {
      this.checkedChanged.emit({ checked, details })
      if (!details.canceled) {
        this.checked.set(checked)
        this.props.sync()
      }
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.item = this.root.controller.checkboxItem(this.props())
    this.put(this.item.part)
  }
}

/** `<span *kpMenuCheckboxItemIndicator>`: in the page while its item is checked. */
@Directive({ selector: "[kpMenuCheckboxItemIndicator]" })
export class KpMenuCheckboxItemIndicator implements OnInit {
  private readonly owner = inject(KpMenuCheckboxItem)
  private readonly present = presentWhile()
  private readonly mount = mounted()

  ngOnInit(): void {
    // In the page while checked, and through its exit.
    const { indicator } = this.owner.item
    this.mount(indicator)
    this.present(indicator.mounted, indicator)
  }
}

@Directive({ selector: "[kpMenuRadioGroup]", exportAs: "kpMenuRadioGroup" })
export class KpMenuRadioGroup<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly valueChanged = output<{ value: Value; details: ChangeDetails }>()

  group!: MenuRadioGroup<Value>
  private readonly root = inject(KP_MENU)
  private readonly put = hostPart()
  private readonly mount = mounted()
  private readonly props = inputsSignal(this, () => ({
    value: this.value(),
    defaultValue: this.defaultValue(),
    disabled: this.disabled(),
    onValueChange: (value: Value, details: ChangeDetails) => {
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
    this.group = this.root.controller.radioGroup(this.props())
    this.put(this.group.root)
    this.mount(this.group)
  }
}

@Directive({ selector: "[kpMenuRadioItem]" })
export class KpMenuRadioItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly label = input<string>()
  /** Whether choosing the item closes the menu. Default: it does not. */
  readonly closeOnSelect = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /** @deprecated Use `[closeOnSelect]`, which wins when both are given. */
  readonly closeOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly owner = inject(KpMenuRadioGroup)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    label: this.label(),
    closeOnSelect: this.closeOnSelect(),
    closeOnClick: this.closeOnClick(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.owner.group.item(this.value(), () => defined(options.get())))
  }
}

/** `<span *kpMenuRadioItemIndicator>`: in the page while its item is the chosen one. */
@Directive({ selector: "[kpMenuRadioItemIndicator]" })
export class KpMenuRadioItemIndicator implements OnInit {
  private readonly item = inject(KpMenuRadioItem)
  private readonly present = presentWhile()
  private readonly mount = mounted()

  ngOnInit(): void {
    const { group } = this.item.owner
    // In the page while chosen, and through its exit.
    const indicator = group.indicator(this.item.value())
    this.mount(indicator)
    this.present(indicator.mounted, indicator)
  }
}
