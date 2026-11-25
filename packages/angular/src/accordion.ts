import {
  DestroyRef,
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { computed, defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type { Accordion, AccordionItem } from "@kirana-ui/core/accordion"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kpAccordion]", exportAs: "kpAccordion" })
export class KpAccordion<Value = unknown> implements OnInit {
  readonly value = model<readonly Value[] | undefined>(undefined)
  readonly defaultValue = input<readonly Value[]>()
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly orientation = input<Orientation>()
  readonly loopFocus = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /**
   * Whether the arrows wrap from the last item to the first.
   * @deprecated Use `loopFocus`, which wins when both are given.
   */
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: Value[]; details: ChangeDetails }>()

  controller!: Accordion<Value>
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    multiple: this.multiple(),
    disabled: this.disabled(),
    orientation: this.orientation(),
    loop: this.loop(),
    loopFocus: this.loopFocus(),
    onValueChange: (value: Value[], details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
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
    this.controller = createAccordion(this.props(), { direction: this.around?.direction })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

/** `value` tells this item from the others; an item that is given none makes its own. */
@Directive({ selector: "[kpAccordionItem]" })
export class KpAccordionItem implements OnInit {
  readonly value = input<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  item!: AccordionItem
  private readonly root = inject(KpAccordion)
  private readonly destroy = inject(DestroyRef)
  private readonly generated = inject(KpIds).make()
  private readonly part = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    const value = this.value()
    this.item = this.root.controller.item(value === undefined ? this.generated : value, () =>
      defined(options.get())
    )
    this.destroy.onDestroy(this.item.mount())
    this.part(this.item.root)
  }
}

@Directive({ selector: "[kpAccordionHeader]" })
export class KpAccordionHeader implements OnInit {
  private readonly owner = inject(KpAccordionItem)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.owner.item.header)
  }
}

@Directive({ selector: "[kpAccordionTrigger]" })
export class KpAccordionTrigger implements OnInit {
  private readonly owner = inject(KpAccordionItem)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.owner.item.trigger)
  }
}

/** `<div *kpAccordionPanel>`: in the page while open; `{ keepMounted: true }` keeps it, hidden. */
@Directive({ selector: "[kpAccordionPanel]" })
export class KpAccordionPanel implements OnInit {
  /**
   * Its options: `{ keepMounted: true }` keeps the panel in the page, hidden, while its item is
   * closed.
   */
  readonly kpAccordionPanel = input<{ keepMounted?: boolean } | "">("")
  private readonly owner = inject(KpAccordionItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const options = this.kpAccordionPanel()
    const keep = typeof options === "object" && options.keepMounted === true
    const { mounted: inPage, panel } = this.owner.item
    this.present(keep ? computed(() => true) : inPage, panel)
  }
}
