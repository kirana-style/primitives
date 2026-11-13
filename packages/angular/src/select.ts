import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined, effect as coreEffect } from "@kirana-ui/core"
import type { Align, ChangeDetails, Side } from "@kirana-ui/core"
import { createSelect } from "@kirana-ui/core/select"
import type { Select } from "@kirana-ui/core/select"

import { KUI_FIELD } from "./field-token"
import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiSelect]", exportAs: "kuiSelect" })
export class KuiSelect implements OnInit {
  readonly value = model<unknown>(undefined)
  readonly defaultValue = input<unknown>(null)
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly required = input(false, { transform: booleanAttribute })
  readonly name = input<string>()
  /** The id of the form the control belongs to, when it is not inside it. */
  readonly form = input<string>()
  readonly items = input<readonly { value: unknown; label: string }[]>()
  readonly kuiId = input<string>()
  readonly valueChanged = output<{ value: unknown; details: ChangeDetails }>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Select
  private readonly field = inject(KUI_FIELD, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    disabled: this.disabled(),
    required: this.required(),
    name: this.name(),
    form: this.form(),
    items: this.items(),
    onValueChange: (value: unknown, details: ChangeDetails) => {
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
export class KuiSelectPositioner implements OnInit {
  readonly side = input<Side>()
  readonly align = input<Align>()
  readonly sideOffset = input<number>()
  readonly alignOffset = input<number>()
  readonly collisionPadding = input<number>()
  private readonly root = inject(KuiSelect)
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

/** Shows the chosen value's label, or `placeholder` while nothing is chosen. */
@Directive({ selector: "[kuiSelectValue]" })
export class KuiSelectValue implements OnInit {
  readonly placeholder = input("")
  private readonly root = inject(KuiSelect)
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly destroy = inject(DestroyRef)
  private readonly put = hostPart()

  constructor() {
    effect(() => {
      this.placeholder()
      untracked(() => this.write())
    })
  }

  private write(): void {
    if (!this.root.controller) return
    this.element.textContent = this.root.controller.label.peek() ?? untracked(this.placeholder)
  }

  ngOnInit(): void {
    this.put(this.root.controller.valuePart)
    this.destroy.onDestroy(
      coreEffect(() => {
        this.root.controller.label.get()
        this.write()
      })
    )
  }
}

@Directive({ selector: "[kuiSelectItem]" })
export class KuiSelectItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  /** What typeahead matches and the trigger shows; the item's text when left out. */
  readonly label = input<string>()
  readonly root = inject(KuiSelect)
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({
    disabled: this.disabled(),
    label: this.label(),
  }))

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
