import {
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from "@angular/core"
import type { EmbeddedViewRef, OnInit, SimpleChanges } from "@angular/core"
import { defined, effect as coreEffect } from "@kirana-ui/core"
import type { ChangeDetails, ItemLabels, ListCollection } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select, SelectGroup, SelectShown } from "@kirana-ui/core/select"

import { KUI_FIELD } from "./field-token"
import {
  KuiIds,
  KuiPositioner,
  binder,
  drawing,
  hostPart,
  inputsSignal,
  mounted,
  presentWhile,
} from "./runtime"

@Directive({ selector: "[kuiSelect]", exportAs: "kuiSelect" })
export class KuiSelect<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /** Shown as it is, focusable, not changeable: the list still opens, and nothing is chosen. */
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  /** The values' labels: a list of values with their labels, or the labels by value. */
  readonly items = input<ItemLabels<Value>>()
  /** Several values: they are `values`, not `value`. */
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly values = model<readonly Value[] | undefined>(undefined)
  readonly defaultValues = input<readonly Value[]>()
  readonly valuesChanged = output<{ values: Value[]; details: ChangeDetails }>()
  /** Every row, when only some are in the page: each item is then given its `index`. */
  readonly virtualized = input<ListCollection>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: Value | null; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Select<Value>
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    items: this.items(),
    multiple: this.multiple(),
    values: this.values(),
    defaultValues: this.defaultValues(),
    onValuesChange: (values: Value[], details: ChangeDetails) => {
      this.valuesChanged.emit({ values, details })
      if (!details.canceled) {
        this.values.set(values)
        this.props.sync()
      }
    },
    virtualized: this.virtualized(),
    onValueChange: (value: Value | null, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
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
    this.controller = createSelect(this.props(), { field: this.field?.controller })
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiSelectPortal]" })
export class KuiSelectPortal implements OnInit {
  private readonly root = inject(KuiSelect)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kuiSelectPositioner]" })
export class KuiSelectPositioner extends KuiPositioner {
  /**
   * The list opens over its trigger, the chosen item's text on the trigger's own, where
   * there is room and unless a finger opened it.
   */
  readonly alignItemWithTrigger = input(false, { transform: booleanAttribute })
  private readonly root = inject(KuiSelect)

  protected placed() {
    return this.root.controller
  }

  constructor() {
    super()
    effect(() => {
      const over = this.alignItemWithTrigger()
      untracked(() => this.root.controller?.alignItemWithTrigger.set(over))
    })
  }

  override ngOnInit(): void {
    this.root.controller.alignItemWithTrigger.set(untracked(this.alignItemWithTrigger))
    super.ngOnInit()
  }
}

function part(name: "trigger" | "popup" | "input") {
  const root = inject(KuiSelect)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiSelectTrigger]" })
export class KuiSelectTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiSelectPopup]" })
export class KuiSelectPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

/** `<input kuiSelectInput>`: submits the value with the form around it. */
@Directive({ selector: "input[kuiSelectInput]" })
export class KuiSelectInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * `<span kuiSelectValue>` shows the chosen value's label, or `placeholder` while nothing is
 * chosen; with `multiple`, the chosen labels with commas between.
 * `<span *kuiSelectValue="let shown">` draws its own content instead, with what is chosen:
 * `shown.value` and `shown.label`, with `multiple` `shown.values` and `shown.labels`, in the
 * items' order.
 */
@Directive({ selector: "[kuiSelectValue]" })
export class KuiSelectValue implements OnInit {
  readonly placeholder = input("")
  private readonly root = inject(KuiSelect)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly template = inject<TemplateRef<{ $implicit: SelectShown }>>(TemplateRef, {
    optional: true,
  })
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly put = binder()

  constructor() {
    effect(() => {
      this.placeholder()
      untracked(() => this.write())
    })
  }

  private write(): void {
    // With a template, the content is the caller's.
    if (!this.root.controller || this.template) return
    this.element.textContent = this.root.controller.label.peek() ?? untracked(this.placeholder)
  }

  ngOnInit(): void {
    const { controller } = this.root
    if (!this.template) {
      this.destroy.onDestroy(this.put(this.element, controller.valuePart))
      this.destroy.onDestroy(
        coreEffect(() => {
          controller.label.get()
          this.write()
        })
      )
      return
    }
    let view: EmbeddedViewRef<{ $implicit: SelectShown }> | undefined
    let unbind: (() => void) | undefined
    this.destroy.onDestroy(() => unbind?.())
    this.destroy.onDestroy(
      coreEffect(() => {
        const shown = controller.shown.get()
        if (view) {
          view.context.$implicit = shown
          const kept = view
          drawing(() => kept.detectChanges())
          return
        }
        drawing(() => {
          const made = this.container.createEmbeddedView(this.template!, { $implicit: shown })
          view = made
          // The content first, then the part, as every part a template draws.
          made.detectChanges()
          const element = (made.rootNodes as Node[]).find(
            (each): each is HTMLElement => each.nodeType === 1
          )
          if (element) unbind = this.put(element, controller.valuePart)
        })
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KuiSelectValue,
    _context: unknown
  ): _context is { $implicit: SelectShown } {
    return true
  }
}

@Directive({ selector: "[kuiSelectItem]" })
export class KuiSelectItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What typeahead matches and the trigger shows; the item's text when left out. */
  readonly label = input<string>()
  /** Its place among all the rows, in a virtualized list. */
  readonly index = input<number>()
  readonly root = inject(KuiSelect)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    label: this.label(),
    index: this.index(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(this.value(), () => defined(options.get())))
  }
}

@Directive({ selector: "[kuiSelectItemText]" })
export class KuiSelectItemText implements OnInit {
  private readonly item = inject(KuiSelectItem)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.item.root.controller.itemText(this.item.value()))
  }
}

/** Items that belong together, named by their `kuiSelectGroupLabel`. */
@Directive({ selector: "[kuiSelectGroup]" })
export class KuiSelectGroup implements OnInit {
  readonly kuiId = input<string>()
  group!: SelectGroup
  private readonly root = inject(KuiSelect)
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.root.controller.group(this.kuiId() ?? this.generated)
    this.put(this.group.root)
  }
}

/** Names the group it is in. With no group around it, it is plain text. */
@Directive({ selector: "[kuiSelectGroupLabel]" })
export class KuiSelectGroupLabel implements OnInit {
  private readonly root = inject(KuiSelect)
  private readonly around = inject(KuiSelectGroup, { optional: true })
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.around?.group.label ?? this.root.controller.groupLabel)
  }
}

/** A line between groups. */
@Directive({ selector: "[kuiSelectSeparator]" })
export class KuiSelectSeparator implements OnInit {
  private readonly root = inject(KuiSelect)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.separator)
  }
}

/** The items' own box inside the popup, when the popup also holds scroll arrows. */
@Directive({ selector: "[kuiSelectList]" })
export class KuiSelectList implements OnInit {
  private readonly root = inject(KuiSelect)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.list)
  }
}

function scrollArrow(direction: "up" | "down") {
  const root = inject(KuiSelect)
  const present = presentWhile()
  const mount = mounted()
  return () => {
    const arrow = root.controller.scrollArrow(direction)
    mount(arrow)
    present(arrow.mounted, arrow.part)
  }
}

/**
 * `<div *kuiSelectScrollUpArrow>`: in the page while there is more of the list above. It
 * scrolls the list while the pointer moves over it.
 */
@Directive({ selector: "[kuiSelectScrollUpArrow]" })
export class KuiSelectScrollUpArrow implements OnInit {
  private readonly init = scrollArrow("up")

  ngOnInit(): void {
    this.init()
  }
}

/** `<div *kuiSelectScrollDownArrow>`: in the page while there is more of the list below. */
@Directive({ selector: "[kuiSelectScrollDownArrow]" })
export class KuiSelectScrollDownArrow implements OnInit {
  private readonly init = scrollArrow("down")

  ngOnInit(): void {
    this.init()
  }
}

/** `<span *kuiSelectItemIndicator>`: in the page while its item is the chosen one. */
@Directive({ selector: "[kuiSelectItemIndicator]" })
export class KuiSelectItemIndicator implements OnInit {
  private readonly item = inject(KuiSelectItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { controller } = this.item.root
    const value = this.item.value()
    this.present(controller.selected(value), controller.itemIndicator(value))
  }
}
