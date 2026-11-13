import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, ListCollection } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type { Listbox, ListboxGroup } from "@kirana-ui/core/listbox"

import { KuiIds, hostPart, inputsSignal, presentWhile } from "./runtime"

@Directive({ selector: "[kuiListbox]", exportAs: "kuiListbox" })
export class KuiListbox implements OnInit {
  readonly value = model<readonly unknown[] | undefined>(undefined)
  readonly defaultValue = input<readonly unknown[]>()
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  /** With a name, the chosen values are submitted with the form around the list. */
  readonly name = input<string>()
  /** The id of the form the list belongs to, when it is not inside it. */
  readonly form = input<string>()
  /** Every row, when only some are in the page: each item is then given its `index`. */
  readonly virtualized = input<ListCollection>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: unknown[]; details: ChangeDetails }>()

  controller!: Listbox
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    multiple: this.multiple(),
    disabled: this.disabled(),
    loop: this.loop(),
    name: this.name(),
    form: this.form(),
    virtualized: this.virtualized(),
    onValueChange: (value: unknown[], details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))

  ngOnInit(): void {
    this.controller = createListbox(this.props())
    this.put(this.controller.root)
  }
}

@Directive({ selector: "[kuiListboxItem]" })
export class KuiListboxItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What typing matches; the item's text when left out. */
  readonly label = input<string>()
  /** Its place among all the rows, in a virtualized list. */
  readonly index = input<number>()
  readonly root = inject(KuiListbox)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    disabled: this.disabled(),
    label: this.label(),
    index: this.index(),
  }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(this.value(), () => defined(options.get())))
  }
}

/** `<span *kuiListboxItemIndicator>`: in the page while its item is chosen. */
@Directive({ selector: "[kuiListboxItemIndicator]" })
export class KuiListboxItemIndicator implements OnInit {
  private readonly item = inject(KuiListboxItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { controller } = this.item.root
    const value = this.item.value()
    this.present(controller.selected(value), controller.indicator(value))
  }
}

@Directive({ selector: "[kuiListboxGroup]" })
export class KuiListboxGroup implements OnInit {
  readonly kuiId = input<string>()
  group!: ListboxGroup
  private readonly root = inject(KuiListbox)
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.root.controller.group(this.kuiId() ?? this.generated)
    this.put(this.group.root)
  }
}

@Directive({ selector: "[kuiListboxGroupLabel]" })
export class KuiListboxGroupLabel implements OnInit {
  private readonly around = inject(KuiListboxGroup)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.around.group.label)
  }
}
