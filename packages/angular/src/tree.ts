import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { computed, defined } from "@kirana-ui/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createTree } from "@kirana-ui/core/tree"
import type { Tree, TreeItem, TreeSelectionMode } from "@kirana-ui/core/tree"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/**
 * On the element that holds the nodes. `[(expandedValue)]` are the open branches' values and
 * `[(selectedValue)]` the chosen nodes' values.
 */
@Directive({ selector: "[kpTree]", exportAs: "kpTree" })
export class KpTree<Value = unknown> implements OnInit {
  readonly expandedValue = model<readonly Value[] | undefined>(undefined)
  readonly defaultExpandedValue = input<readonly Value[]>()
  readonly selectionMode = input<TreeSelectionMode>()
  readonly selectedValue = model<readonly Value[] | undefined>(undefined)
  readonly defaultSelectedValue = input<readonly Value[]>()
  /** Whether a press on a branch (or Enter on it) also opens or closes it. Default `true`. */
  readonly expandOnClick = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly kpId = input<string>()
  /** A branch about to open or close, with the values then open; `details.cancel()` keeps them. */
  readonly expandedChanged = output<{ value: Value[]; details: ChangeDetails }>()
  /** Nodes about to be chosen or taken away; `details.cancel()` keeps them. */
  readonly selectedChanged = output<{ value: Value[]; details: ChangeDetails }>()

  controller!: Tree<Value>
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    expandedValue: this.expandedValue(),
    defaultExpandedValue: this.defaultExpandedValue(),
    selectionMode: this.selectionMode(),
    selectedValue: this.selectedValue(),
    defaultSelectedValue: this.defaultSelectedValue(),
    expandOnClick: this.expandOnClick(),
    onExpandedChange: (value: Value[], details: ChangeDetails) => {
      this.expandedChanged.emit({ value, details })
      if (!details.canceled) {
        this.expandedValue.set(value)
        this.props.sync()
      }
    },
    onSelectedChange: (value: Value[], details: ChangeDetails) => {
      this.selectedChanged.emit({ value, details })
      if (!details.canceled) {
        this.selectedValue.set(value)
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
    this.controller = createTree(this.props(), { direction: this.around?.direction })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

/**
 * One node. `value` tells it from the others in the tree; `branch` makes it one that holds
 * children in its `kpTreeGroup`. Its depth is known from how the nodes are nested, so a server
 * writes it too.
 */
@Directive({ selector: "[kpTreeItem]" })
export class KpTreeItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly branch = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /** A branch whose children are being loaded. */
  readonly loading = input(false, { transform: booleanAttribute })
  /** What typing matches, when it is not the node's text. */
  readonly label = input<string>()
  item!: TreeItem
  /** How deep it is, from 1: one more than the node around it. */
  readonly level: number = depth()
  private readonly root = inject(KpTree)
  private readonly part = hostPart()
  private readonly mount = mounted()
  private readonly options = inputsSignal(this, () => ({
    branch: this.branch(),
    disabled: this.disabled(),
    loading: this.loading(),
    label: this.label(),
    level: this.level,
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    // Made once for the directive: the controller makes a new node each time it is asked.
    this.item = this.root.controller.item(this.value(), () => defined(options.get()))
    this.part(this.item.root)
    this.mount(this.item)
  }
}

/** One more than the depth of the node around, or 1 at the top. */
function depth(): number {
  return (inject(KpTreeItem, { skipSelf: true, optional: true })?.level ?? 0) + 1
}

function part(name: "row" | "indicator" | "text") {
  const owner = inject(KpTreeItem)
  const put = hostPart()
  return () => put(owner.item[name])
}

@Directive({ selector: "[kpTreeItemRow]" })
export class KpTreeItemRow implements OnInit {
  private readonly init = part("row")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpTreeItemIndicator]" })
export class KpTreeItemIndicator implements OnInit {
  private readonly init = part("indicator")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpTreeItemText]" })
export class KpTreeItemText implements OnInit {
  private readonly init = part("text")

  ngOnInit(): void {
    this.init()
  }
}

/** `<div *kpTreeGroup>`: in the page while its branch is open; `{ keepMounted: true }` keeps it, hidden. */
@Directive({ selector: "[kpTreeGroup]" })
export class KpTreeGroup implements OnInit {
  /**
   * Its options: `{ keepMounted: true }` keeps the group in the page, hidden, while its branch
   * is closed.
   */
  readonly kpTreeGroup = input<{ keepMounted?: boolean } | "">("")
  private readonly owner = inject(KpTreeItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const options = this.kpTreeGroup()
    const keep = typeof options === "object" && options.keepMounted === true
    const { mounted: inPage, group } = this.owner.item
    this.present(keep ? computed(() => true) : inPage, group)
  }
}
