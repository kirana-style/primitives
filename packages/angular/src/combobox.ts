import {
  Directive,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { Align, ChangeDetails, ListCollection, Side } from "@kirana-ui/core"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox } from "@kirana-ui/core/combobox"

import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiCombobox]", exportAs: "kuiCombobox" })
export class KuiCombobox implements OnInit {
  readonly value = model<unknown>(undefined)
  readonly defaultValue = input<unknown>(null)
  readonly inputValue = model<string | undefined>(undefined)
  readonly defaultInputValue = input<string>()
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly items = input<readonly { value: unknown; label: string }[]>()
  /** Whether an item is shown for what was typed; `null` shows every item. */
  readonly filter = input<((label: string, query: string) => boolean) | null>()
  /** In a field, "none" is then wrong. */
  readonly required = input(false, { transform: booleanAttribute })
  /** The list is always in the page, with no popup: a command palette. */
  readonly inline = input(false, { transform: booleanAttribute })
  /** Every row, when only some are in the page: each item is then given its `index`. */
  readonly virtualized = input<ListCollection>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: unknown; details: ChangeDetails }>()
  readonly inputValueChanged = output<{ value: string; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Combobox
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    inputValue: this.inputValue(),
    defaultInputValue: this.defaultInputValue(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    name: this.name(),
    form: this.form(),
    items: this.items(),
    filter: this.filter(),
    required: this.required(),
    inline: this.inline(),
    virtualized: this.virtualized(),
    onValueChange: (value: unknown, details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
    onInputValueChange: (value: string, details: ChangeDetails) => {
      this.inputValueChanged.emit({ value, details })
      if (!details.canceled) {
        this.inputValue.set(value)
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

  ngOnInit(): void {
    this.controller = createCombobox(this.props(), { field: this.field?.controller })
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiComboboxPortal]" })
export class KuiComboboxPortal implements OnInit {
  private readonly root = inject(KuiCombobox)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kuiComboboxPositioner]" })
export class KuiComboboxPositioner implements OnInit {
  readonly side = input<Side>()
  readonly align = input<Align>()
  readonly sideOffset = input<number>()
  readonly alignOffset = input<number>()
  readonly collisionPadding = input<number>()
  private readonly root = inject(KuiCombobox)
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
    this.root.controller.positioning.set(untracked(this.options))
    this.put(this.root.controller.positioner)
  }
}

function part(name: "input" | "trigger" | "popup" | "hidden") {
  const root = inject(KuiCombobox)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** `<input kuiComboboxInput>`: what is typed filters the list, which is placed against it. */
@Directive({ selector: "input[kuiComboboxInput]" })
export class KuiComboboxInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiComboboxTrigger]" })
export class KuiComboboxTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiComboboxPopup]" })
export class KuiComboboxPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

/** `<input kuiComboboxHiddenInput>`: submits the value with the form around it. */
@Directive({ selector: "input[kuiComboboxHiddenInput]" })
export class KuiComboboxHiddenInput implements OnInit {
  private readonly init = part("hidden")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiComboboxItem]" })
export class KuiComboboxItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What is filtered and what the input shows; the item's text when left out. */
  readonly label = input<string>()
  readonly kuiId = input<string>()
  /** Its place among all the rows, in a virtualized list. */
  readonly index = input<number>()
  readonly root = inject(KuiCombobox)
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    disabled: this.disabled(),
    label: this.label(),
    index: this.index(),
    id: this.kuiId() ?? this.generated,
  }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(this.value(), () => options.get()))
  }
}

/** `<span *kuiComboboxItemIndicator>`: in the page while its item is the chosen one. */
@Directive({ selector: "[kuiComboboxItemIndicator]" })
export class KuiComboboxItemIndicator implements OnInit {
  private readonly item = inject(KuiComboboxItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { controller } = this.item.root
    const value = this.item.value()
    this.present(controller.selected(value), controller.itemIndicator(value))
  }
}

/** `<button *kuiComboboxClear>`: empties the input and the value; in the page while there is something to clear. */
@Directive({ selector: "[kuiComboboxClear]" })
export class KuiComboboxClear implements OnInit {
  private readonly root = inject(KuiCombobox)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.clearable, this.root.controller.clear)
  }
}

/** `<div *kuiComboboxEmpty>`: in the page while no item is shown for what was typed. */
@Directive({ selector: "[kuiComboboxEmpty]" })
export class KuiComboboxEmpty implements OnInit {
  private readonly root = inject(KuiCombobox)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.empty, this.root.controller.emptyPart)
  }
}
