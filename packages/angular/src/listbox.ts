import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, ListCollection } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type { Listbox, ListboxGroup } from "@kirana-ui/core/listbox"

import { KpIds, hostPart, inputsSignal, presentWhile } from "./runtime"

@Directive({ selector: "[kpListbox]", exportAs: "kpListbox" })
export class KpListbox<Value = unknown> implements OnInit {
  readonly value = model<readonly Value[] | undefined>(undefined)
  readonly defaultValue = input<readonly Value[]>()
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  /** With a name, the chosen values are submitted with the form around the list. */
  readonly name = input<string>()
  /** The id of the form the list belongs to, when it is not inside it. */
  readonly form = input<string>()
  /** Every row, when only some are in the page: each item is then given its `index`. */
  readonly virtualized = input<ListCollection>()
  readonly kpId = input<string>()
  readonly valueChanged = output<{ value: Value[]; details: ChangeDetails }>()

  controller!: Listbox<Value>
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    multiple: this.multiple(),
    disabled: this.disabled(),
    loop: this.loop(),
    name: this.name(),
    form: this.form(),
    virtualized: this.virtualized(),
    onValueChange: (value: Value[], details: ChangeDetails) => {
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
    this.controller = createListbox(this.props())
    this.put(this.controller.root)
  }
}

@Directive({ selector: "[kpListboxItem]" })
export class KpListboxItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What typing matches; the item's text when left out. */
  readonly label = input<string>()
  /** Its place among all the rows, in a virtualized list. */
  readonly index = input<number>()
  readonly root = inject(KpListbox)
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

/** `<span *kpListboxItemIndicator>`: in the page while its item is chosen. */
@Directive({ selector: "[kpListboxItemIndicator]" })
export class KpListboxItemIndicator implements OnInit {
  private readonly item = inject(KpListboxItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { controller } = this.item.root
    const value = this.item.value()
    this.present(controller.selected(value), controller.indicator(value))
  }
}

@Directive({ selector: "[kpListboxGroup]" })
export class KpListboxGroup implements OnInit {
  readonly kpId = input<string>()
  group!: ListboxGroup
  private readonly root = inject(KpListbox)
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.root.controller.group(this.kpId() ?? this.generated)
    this.put(this.group.root)
  }
}

@Directive({ selector: "[kpListboxGroupLabel]" })
export class KpListboxGroupLabel implements OnInit {
  private readonly around = inject(KpListboxGroup)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.around.group.label)
  }
}
