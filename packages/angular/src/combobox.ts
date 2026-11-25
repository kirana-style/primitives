import {
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
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
import { computed, effect as coreEffect } from "@kirana-ui/core"
import type { ChangeDetails, ListCollection, Presentation, ReadonlySignal } from "@kirana-ui/core"
import { createAutocomplete } from "@kirana-ui/core/autocomplete"
import type { AutocompleteProps } from "@kirana-ui/core/autocomplete"
import { createCombobox } from "@kirana-ui/core/combobox"
import type {
  Combobox,
  ComboboxEntry,
  ComboboxGroup,
  ComboboxProps,
  ComboboxShown,
} from "@kirana-ui/core/combobox"

import { KP_DIRECTION } from "./direction-token"
import { KP_FIELD } from "./field-token"
import {
  KpIds,
  KpPositioner,
  drawing,
  hostPart,
  inputsSignal,
  mounted,
  onServer,
  ownText,
  presentWhile,
} from "./runtime"

/**
 * `kpAutocomplete` is a combobox whose text is the value: `[(value)]` is the text, and the
 * list only suggests. Its parts are the combobox's directives.
 */
@Directive({ selector: "[kpCombobox],[kpAutocomplete]", exportAs: "kpCombobox" })
export class KpCombobox<Value = unknown, Multiple extends boolean = false> implements OnInit {
  /** With `[multiple]="true"`, the chosen values. */
  readonly value = model<(Multiple extends true ? readonly Value[] : Value | null) | undefined>(
    undefined
  )
  readonly defaultValue = input<NoInfer<Multiple extends true ? readonly Value[] : Value | null>>()
  /** What the input says, `[(inputValue)]`. With `kpAutocomplete` the text is `[(value)]`. */
  readonly inputValue = model<string | undefined>(undefined)
  /** The text the input starts with, when the caller does not hold `inputValue`. Read once. */
  readonly defaultInputValue = input<string>()
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  /**
   * Its value can be read and not changed: the list still opens and can be gone through, but
   * no press and no Enter chooses, nothing typed is taken, and its clear and chip buttons do
   * nothing. Its value is still submitted.
   */
  readonly readOnly = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  /**
   * The values with their labels: a list of them, groups of them (`{ value, items }`), or the
   * labels by value. With a `*kpComboboxCollection` it is the list itself: the combobox
   * filters it, and the collection draws what is left.
   */
  readonly items = input<ComboboxProps<Value>["items"]>()
  /** Whether an item is shown for what was typed; `null` shows every item. */
  readonly filter = input<((label: string, query: string) => boolean) | null>()
  /** In a field, "none" is then wrong. */
  readonly required = input(false, { transform: booleanAttribute })
  /**
   * Several values, each shown as a chip: `value` and `valueChanged` then hold a list. Bound
   * to `true` (`[multiple]="true"`), it types them so. The bare attribute, or a bound boolean,
   * works the same, and then `value` takes either and `valueChanged` is typed as one value:
   * Angular's compiler gives a type parameter it cannot infer `any`, so only a literal `true`
   * says it.
   */
  readonly multiple = input<Multiple | undefined, Multiple | "" | undefined>(undefined, {
    transform: booleanAttribute as (given: Multiple | "" | undefined) => Multiple,
  })
  /**
   * With `multiple`: the chosen values.
   * @deprecated Use `[(value)]`, which holds the list with `multiple` and wins when both are given.
   */
  readonly values = model<readonly Value[] | undefined>(undefined)
  /**
   * With `multiple`: the values it starts with.
   * @deprecated Use `[defaultValue]`, which holds the list with `multiple` and wins.
   */
  readonly defaultValues = input<readonly Value[]>()
  /**
   * With `multiple`: heard as a value is about to be added or taken away.
   * @deprecated Use `(valueChanged)`, told the list with `multiple`. Both are emitted.
   */
  readonly valuesChanged = output<{ values: Value[]; details: ChangeDetails }>()
  /** The list is always in the page, with no popup: a command palette. */
  readonly inline = input(false, { transform: booleanAttribute })
  /** Every row, when only some are in the page: each item is then given its `index`. */
  readonly virtualized = input<ListCollection>()
  /**
   * How the list opens: `"sheet"` from the bottom edge, modal, with a backdrop, the input then
   * in the popup; `"auto"` a sheet on a narrow touch screen. Default `"popup"`.
   */
  readonly presentation = input<Presentation>()
  /** With `presentation="auto"`: the viewport's width under which a coarse pointer opens a sheet. Default 640. */
  readonly sheetBelow = input<number>()
  /**
   * The first item shown for what was typed is highlighted as one types, so Enter chooses it.
   * Off by default.
   */
  readonly autoHighlight = input(false, { transform: booleanAttribute })
  /** For values that are objects: the text the input shows for one, and what is filtered. */
  readonly itemToStringLabel = input<(value: Value) => string>()
  /** For values that are objects: the text the form is sent for one. */
  readonly itemToStringValue = input<(value: Value) => string>()
  /**
   * With `kpAutocomplete`: `"none"` shows the suggestions as the caller draws them; `"both"`
   * and `"inline"` write the rest of the first that begins with what is typed into the input.
   */
  readonly mode = input<AutocompleteProps["mode"]>()
  /** With `kpAutocomplete`: a press on the input opens the list. */
  readonly openOnInputClick = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  readonly valueChanged = output<{
    value: true extends Multiple ? (false extends Multiple ? Value | null : Value[]) : Value | null
    details: ChangeDetails
  }>()
  /** Heard as the input's text is about to change; `details.cancel()` keeps it as it was. */
  readonly inputValueChanged = output<{ value: string; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Combobox<Value>
  private readonly autocomplete =
    inject(new HostAttributeToken("kpAutocomplete"), { optional: true }) !== null
  private readonly field = inject(KP_FIELD, { optional: true })
  private readonly direction = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    inputValue: this.inputValue(),
    defaultInputValue: this.defaultInputValue(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    readOnly: this.readOnly(),
    name: this.name(),
    form: this.form(),
    items: this.items(),
    filter: this.filter(),
    required: this.required(),
    multiple: this.multiple(),
    values: this.values(),
    defaultValues: this.defaultValues(),
    inline: this.inline(),
    mode: this.mode(),
    openOnInputClick: this.openOnInputClick(),
    virtualized: this.virtualized(),
    presentation: this.presentation(),
    sheetBelow: this.sheetBelow(),
    autoHighlight: this.autoHighlight(),
    itemToStringLabel: this.itemToStringLabel(),
    itemToStringValue: this.itemToStringValue(),
    onValueChange: (value: Value | Value[] | null, details: ChangeDetails) => {
      this.valueChanged.emit({
        value: value as true extends Multiple
          ? false extends Multiple
            ? Value | null
            : Value[]
          : Value | null,
        details,
      })
      // With `multiple` the core tells the list here, as Base UI's `onValueChange` is told it;
      // the older output too, as an output cannot tell whether it is bound.
      const list = this.multiple() && Array.isArray(value) ? value : undefined
      if (list) this.valuesChanged.emit({ values: list, details })
      if (details.canceled) return
      // Written back to what the caller holds: the older `values` only when it holds that alone.
      if (list && this.values() !== undefined && this.value() === undefined) this.values.set(list)
      else this.value.set(value as Multiple extends true ? readonly Value[] : Value | null)
      this.props.sync()
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

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    const around = { field: this.field?.controller, direction: this.direction?.direction }
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
              readOnly: own.readOnly,
              items: own.items as AutocompleteProps["items"],
              required: own.required,
              name: own.name,
              form: own.form,
              virtualized: own.virtualized,
              autoHighlight: own.autoHighlight,
            }
          }),
          around
        ) as Combobox<Value>)
      : // Typed by what Angular can infer of `Multiple`; the core reads either shape.
        createCombobox(
          props as ReadonlySignal<unknown> as ReadonlySignal<
            ComboboxProps<Value, boolean | undefined>
          >,
          around
        )
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kpComboboxPortal]" })
export class KpComboboxPortal implements OnInit {
  private readonly root = inject(KpCombobox)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

@Directive({ selector: "[kpComboboxPositioner]" })
export class KpComboboxPositioner extends KpPositioner {
  private readonly root = inject(KpCombobox)

  protected placed() {
    return this.root.controller
  }
}

function part(
  name: "input" | "trigger" | "popup" | "list" | "hidden" | "chips" | "status" | "backdrop"
) {
  const root = inject(KpCombobox)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** `<input kpComboboxInput>`: what is typed filters the list, which is placed against it. */
@Directive({ selector: "input[kpComboboxInput]" })
export class KpComboboxInput implements OnInit {
  private readonly init = part("input")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpComboboxTrigger]" })
export class KpComboboxTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpComboboxPopup]" })
export class KpComboboxPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

/** `<div kpComboboxBackdrop>`, in the portal: what lies over the page behind the list. */
@Directive({ selector: "[kpComboboxBackdrop]" })
export class KpComboboxBackdrop implements OnInit {
  private readonly init = part("backdrop")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * The items' own box inside the popup, when the popup holds more than items (an input): it is
 * then the listbox.
 */
@Directive({ selector: "[kpComboboxList]" })
export class KpComboboxList implements OnInit {
  private readonly init = part("list")

  ngOnInit(): void {
    this.init()
  }
}

/** `<input kpComboboxHiddenInput>`: submits the value with the form around it. */
@Directive({ selector: "input[kpComboboxHiddenInput]" })
export class KpComboboxHiddenInput implements OnInit {
  private readonly init = part("hidden")

  ngOnInit(): void {
    this.init()
  }
}

/** Items that belong together, named by their `kpComboboxGroupLabel`. Hidden while none is shown. */
@Directive({ selector: "[kpComboboxGroup]" })
export class KpComboboxGroup implements OnInit {
  readonly kpId = input<string>()
  group!: ComboboxGroup
  private readonly root = inject(KpCombobox)
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.group = this.root.controller.group(this.kpId() ?? this.generated)
    this.put(this.group.root)
  }
}

/** Names the group it is in. With no group around it, it is plain text. */
@Directive({ selector: "[kpComboboxGroupLabel]" })
export class KpComboboxGroupLabel implements OnInit {
  private readonly root = inject(KpCombobox)
  private readonly around = inject(KpComboboxGroup, { optional: true })
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.around?.group.label ?? this.root.controller.groupLabel)
  }
}

/** A line between groups. */
@Directive({ selector: "[kpComboboxSeparator]" })
export class KpComboboxSeparator implements OnInit {
  private readonly root = inject(KpCombobox)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.separator)
  }
}

@Directive({ selector: "[kpComboboxItem]" })
export class KpComboboxItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What is filtered and what the input shows; the item's text when left out. */
  readonly label = input<string>()
  readonly kpId = input<string>()
  /** Its place among all the rows, in a virtualized list. */
  readonly index = input<number>()
  readonly root = inject(KpCombobox)
  private readonly within = inject(KpComboboxGroup, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({
    disabled: this.disabled(),
    label: this.label(),
    index: this.index(),
    id: this.kpId() ?? this.generated,
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.item(this.value(), () => options.get(), this.within?.group))
  }
}

/** `<span *kpComboboxItemIndicator>`: in the page while its item is the chosen one. */
@Directive({ selector: "[kpComboboxItemIndicator]" })
export class KpComboboxItemIndicator implements OnInit {
  private readonly item = inject(KpComboboxItem)
  private readonly present = presentWhile()
  private readonly mount = mounted()

  ngOnInit(): void {
    // In the page while chosen, and through its exit.
    const indicator = this.item.root.controller.itemIndicator(this.item.value())
    this.mount(indicator)
    this.present(indicator.mounted, indicator)
  }
}

/** With `multiple`: what holds the chips and the input. */
@Directive({ selector: "[kpComboboxChips]" })
export class KpComboboxChips implements OnInit {
  private readonly init = part("chips")

  ngOnInit(): void {
    this.init()
  }
}

/** With `multiple`: one chosen value. Its `value` is what its remove button takes away. */
@Directive({ selector: "[kpComboboxChip]" })
export class KpComboboxChip implements OnInit {
  readonly value = input.required<unknown>()
  readonly root = inject(KpCombobox)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.chip(this.value()))
  }
}

@Directive({ selector: "[kpComboboxChipRemove]" })
export class KpComboboxChipRemove implements OnInit {
  private readonly chip = inject(KpComboboxChip)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.chip.root.controller.chipRemove(this.chip.value()))
  }
}

/** `<button *kpComboboxClear>`: empties the input and the value; in the page while there is something to clear. */
@Directive({ selector: "[kpComboboxClear]" })
export class KpComboboxClear implements OnInit {
  private readonly root = inject(KpCombobox)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.clearable, this.root.controller.clear)
  }
}

/** `<div *kpComboboxEmpty>`: in the page while no item is shown for what was typed. */
@Directive({ selector: "[kpComboboxEmpty]" })
export class KpComboboxEmpty implements OnInit {
  private readonly root = inject(KpCombobox)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.present(this.root.controller.empty, this.root.controller.emptyPart)
  }
}

/**
 * Says how the list stands ("3 results", "Loading") to software that reads the page, as its
 * text changes. Keep it in the page and change what it holds: inside the popup, or beside the
 * input.
 */
@Directive({ selector: "[kpComboboxStatus]" })
export class KpComboboxStatus implements OnInit {
  private readonly init = part("status")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * `<span kpComboboxValue [placeholder]="'Pick one'">` says the chosen value's label, or its
 * placeholder while nothing is chosen; with `multiple`, the chosen labels with commas between.
 * An element with content of its own says that instead.
 * `<ng-container *kpComboboxValue="let shown">` draws its own content instead, with what is
 * chosen: `shown.value` and `shown.label`, with `multiple` `shown.values` and `shown.labels`,
 * in the order they were chosen. For a button that is the combobox, its input inside the popup.
 */
@Directive({ selector: "[kpComboboxValue]" })
export class KpComboboxValue implements OnInit {
  readonly placeholder = input("")
  private readonly root = inject(KpCombobox)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly template = inject<TemplateRef<{ $implicit: ComboboxShown }>>(TemplateRef, {
    optional: true,
  })
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  // Where the label is written: nowhere with a template, or with content of the element's own.
  private text: Text | null = null

  constructor() {
    effect(() => {
      this.placeholder()
      untracked(() => this.write())
    })
  }

  private write(): void {
    if (!this.text) return
    this.text.data = this.root.controller.shown.peek().label ?? untracked(this.placeholder)
  }

  ngOnInit(): void {
    const { controller } = this.root
    if (!this.template) {
      this.text = ownText(this.element, this.server)
      this.destroy.onDestroy(
        coreEffect(() => {
          controller.shown.get()
          this.write()
        })
      )
      return
    }
    let view: EmbeddedViewRef<{ $implicit: ComboboxShown }> | undefined
    this.destroy.onDestroy(
      coreEffect(() => {
        const shown = controller.shown.get()
        if (!view) view = this.container.createEmbeddedView(this.template!, { $implicit: shown })
        else view.context.$implicit = shown
        const kept = view
        drawing(() => kept.detectChanges())
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpComboboxValue,
    _context: unknown
  ): _context is { $implicit: ComboboxShown } {
    return true
  }
}

type Drawn = EmbeddedViewRef<{ $implicit: ComboboxEntry }>

/**
 * `<ng-container *kpComboboxCollection="let entry">` draws the list from the root's `items`:
 * once for each item left for what was typed, or for each group that has items left. With
 * `of` (`*kpComboboxCollection="let item; of: group"`), for each of that group's items left.
 * The root then filters, and no item hides itself.
 */
@Directive({ selector: "[kpComboboxCollection]" })
export class KpComboboxCollection implements OnInit {
  /** A group the root's `items` gave: its items left are then what is drawn. */
  readonly kpComboboxCollectionOf = input<ComboboxEntry>()
  private readonly root = inject(KpCombobox)
  private readonly template = inject<TemplateRef<{ $implicit: ComboboxEntry }>>(TemplateRef)
  private readonly container = inject(ViewContainerRef)
  private readonly destroy = inject(DestroyRef)
  private readonly server = onServer()
  private readonly views = new Map<string, Drawn>()

  ngOnInit(): void {
    // A group is known by its key, which is its own for as long as it is drawn.
    const left = this.root.controller.entries(untracked(this.kpComboboxCollectionOf))
    const draw = (entries: readonly ComboboxEntry[]) => {
      // By key: an item that is left keeps its element.
      const wanted = new Set(entries.map((each) => each.key))
      for (const [key, view] of this.views) {
        if (wanted.has(key)) continue
        view.destroy()
        this.views.delete(key)
      }
      // What stays is already in order (the items are never reordered), so nothing is moved.
      // What is new goes in at its place.
      entries.forEach((entry, at) => {
        let view = this.views.get(entry.key)
        if (!view) {
          view = this.container.createEmbeddedView(this.template, { $implicit: entry }, at)
          this.views.set(entry.key, view)
        } else view.context.$implicit = entry
        view.detectChanges()
      })
    }
    if (this.server) return draw(left.peek())
    this.destroy.onDestroy(
      coreEffect(() => {
        const entries = left.get()
        drawing(() => draw(entries))
      })
    )
  }

  static ngTemplateContextGuard(
    _directive: KpComboboxCollection,
    _context: unknown
  ): _context is { $implicit: ComboboxEntry } {
    return true
  }
}
