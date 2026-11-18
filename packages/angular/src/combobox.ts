import {
  Directive,
  HostAttributeToken,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { computed } from "@kirana-ui/core"
import type { ChangeDetails, ItemLabels, ListCollection } from "@kirana-ui/core"
import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import { createCombobox } from "@kirana-ui/core/combobox"
import type { Combobox, ComboboxGroup } from "@kirana-ui/core/combobox"

import { KUI_FIELD } from "./field-token"
import { KuiIds, KuiPositioner, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/**
 * `kuiAutocomplete` is a combobox whose text is the value: `[(value)]` is the text, and the
 * list only suggests. Its parts are the combobox's directives.
 */
@Directive({ selector: "[kuiCombobox],[kuiAutocomplete]", exportAs: "kuiCombobox" })
export class KuiCombobox<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  /** What the input says, `[(inputValue)]`. With `kuiAutocomplete` the text is `[(value)]`. */
  readonly inputValue = model<string | undefined>(undefined)
  /** The text the input starts with, when the caller does not hold `inputValue`. Read once. */
  readonly defaultInputValue = input<string>()
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  /** The values' labels: a list of values with their labels, or the labels by value. */
  readonly items = input<ItemLabels<Value>>()
  /** Whether an item is shown for what was typed; `null` shows every item. */
  readonly filter = input<((label: string, query: string) => boolean) | null>()
  /** In a field, "none" is then wrong. */
  readonly required = input(false, { transform: booleanAttribute })
  /** Several values, each shown as a chip: they are `values`, not `value`. */
  readonly multiple = input(false, { transform: booleanAttribute })
  /** With `multiple`: the chosen values, in the order they were chosen, `[(values)]`. */
  readonly values = model<readonly Value[] | undefined>(undefined)
  /**
   * With `multiple`: the values it starts with, when the caller does not hold `values`. Read once.
   */
  readonly defaultValues = input<readonly Value[]>()
  /**
   * With `multiple`: heard as a value is about to be added or taken away; `details.cancel()` keeps
   * the values as they were.
   */
  readonly valuesChanged = output<{ values: Value[]; details: ChangeDetails }>()
  /** The list is always in the page, with no popup: a command palette. */
  readonly inline = input(false, { transform: booleanAttribute })
  /** Every row, when only some are in the page: each item is then given its `index`. */
  readonly virtualized = input<ListCollection>()
  /**
   * The first item shown for what was typed is highlighted as one types, so Enter chooses it.
   * Off by default.
   */
  readonly autoHighlight = input(false, { transform: booleanAttribute })
  /** With `kuiAutocomplete`: `"none"` shows the suggestions as the caller draws them. */
  readonly mode = input<AutocompleteProps["mode"]>()
  /** With `kuiAutocomplete`: a press on the input opens the list. */
  readonly openOnInputClick = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: Value | null; details: ChangeDetails }>()
  /** Heard as the input's text is about to change; `details.cancel()` keeps it as it was. */
  readonly inputValueChanged = output<{ value: string; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Combobox<Value>
  private readonly autocomplete =
    inject(new HostAttributeToken("kuiAutocomplete"), { optional: true }) !== null
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
    inline: this.inline(),
    mode: this.mode(),
    openOnInputClick: this.openOnInputClick(),
    virtualized: this.virtualized(),
    autoHighlight: this.autoHighlight(),
    onValueChange: (value: Value | null, details: ChangeDetails) => {
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
    const around = { field: this.field?.controller }
    const props = this.props()
    this.controller = this.autocomplete
      ? // An autocomplete's value is its text: `Value` is a string there.
        (createAutocomplete(
          computed<AutocompleteProps>(() => {
            const own = props.get()
            return {
              id: own.id,
              value: own.value as string | undefined,
              defaultValue: (own.defaultValue as string | null) ?? undefined,
              onValueChange: own.onValueChange as AutocompleteProps["onValueChange"],
              open: own.open,
              defaultOpen: own.defaultOpen,
              onOpenChange: own.onOpenChange,
              mode: own.mode,
              filter: own.filter,
              openOnInputClick: own.openOnInputClick,
              disabled: own.disabled,
              required: own.required,
              name: own.name,
              form: own.form,
              virtualized: own.virtualized,
              autoHighlight: own.autoHighlight,
            }
          }),
          around
        ) as Combobox<Value>)
      : createCombobox(props, around)
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
export class KuiComboboxPositioner extends KuiPositioner {
  private readonly root = inject(KuiCombobox)

  protected placed() {
    return this.root.controller
  }
}

function part(name: "input" | "trigger" | "popup" | "list" | "hidden" | "chips") {
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

/**
 * The items' own box inside the popup, when the popup holds more than items (an input): it is
 * then the listbox.
 */
@Directive({ selector: "[kuiComboboxList]" })
export class KuiComboboxList implements OnInit {
  private readonly init = part("list")

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

/** Items that belong together, named by their `kuiComboboxGroupLabel`. Hidden while none is shown. */
@Directive({ selector: "[kuiComboboxGroup]" })
export class KuiComboboxGroup implements OnInit {
  readonly kuiId = input<string>()
  group!: ComboboxGroup
  private readonly root = inject(KuiCombobox)
  private readonly generated = inject(KuiIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.root.controller.group(this.kuiId() ?? this.generated)
    this.put(this.group.root)
  }
}

/** Names the group it is in. With no group around it, it is plain text. */
@Directive({ selector: "[kuiComboboxGroupLabel]" })
export class KuiComboboxGroupLabel implements OnInit {
  private readonly root = inject(KuiCombobox)
  private readonly around = inject(KuiComboboxGroup, { optional: true })
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.around?.group.label ?? this.root.controller.groupLabel)
  }
}

/** A line between groups. */
@Directive({ selector: "[kuiComboboxSeparator]" })
export class KuiComboboxSeparator implements OnInit {
  private readonly root = inject(KuiCombobox)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.separator)
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
  private readonly within = inject(KuiComboboxGroup, { optional: true })
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
    this.put(this.root.controller.item(this.value(), () => options.get(), this.within?.group))
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

/** With `multiple`: what holds the chips and the input. */
@Directive({ selector: "[kuiComboboxChips]" })
export class KuiComboboxChips implements OnInit {
  private readonly init = part("chips")

  ngOnInit(): void {
    this.init()
  }
}

/** With `multiple`: one chosen value. Its `value` is what its remove button takes away. */
@Directive({ selector: "[kuiComboboxChip]" })
export class KuiComboboxChip implements OnInit {
  readonly value = input.required<unknown>()
  readonly root = inject(KuiCombobox)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.chip(this.value()))
  }
}

@Directive({ selector: "[kuiComboboxChipRemove]" })
export class KuiComboboxChipRemove implements OnInit {
  private readonly chip = inject(KuiComboboxChip)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.chip.root.controller.chipRemove(this.chip.value()))
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
