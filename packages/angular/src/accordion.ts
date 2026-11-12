import {
  DestroyRef,
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { computed, defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type { Accordion, AccordionItem } from "@kirana-ui/core/accordion"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiAccordion]", exportAs: "kuiAccordion" })
export class KuiAccordion implements OnInit {
  readonly value = model<readonly unknown[] | undefined>(undefined)
  readonly defaultValue = input<readonly unknown[]>()
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly orientation = input<Orientation>()
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: unknown[]; details: ChangeDetails }>()

  controller!: Accordion
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    multiple: this.multiple(),
    disabled: this.disabled(),
    orientation: this.orientation(),
    loop: this.loop(),
    onValueChange: (value: unknown[], details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createAccordion(this.props(), { direction: this.around?.direction })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiAccordionItem]" })
export class KuiAccordionItem implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  item!: AccordionItem
  private readonly root = inject(KuiAccordion)
  private readonly destroy = inject(DestroyRef)
  private readonly part = hostPart()
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    this.item = this.root.controller.item(this.value(), () => defined(options.get()))
    this.destroy.onDestroy(this.item.mount())
    this.part(this.item.root)
  }
}

@Directive({ selector: "[kuiAccordionHeader]" })
export class KuiAccordionHeader implements OnInit {
  private readonly owner = inject(KuiAccordionItem)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.owner.item.header)
  }
}

@Directive({ selector: "[kuiAccordionTrigger]" })
export class KuiAccordionTrigger implements OnInit {
  private readonly owner = inject(KuiAccordionItem)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.owner.item.trigger)
  }
}

/** `<div *kuiAccordionPanel>`: in the page while open; `{ keepMounted: true }` keeps it, hidden. */
@Directive({ selector: "[kuiAccordionPanel]" })
export class KuiAccordionPanel implements OnInit {
  readonly kuiAccordionPanel = input<{ keepMounted?: boolean } | "">("")
  private readonly owner = inject(KuiAccordionItem)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const options = this.kuiAccordionPanel()
    const keep = typeof options === "object" && options.keepMounted === true
    const { mounted: inPage, panel } = this.owner.item
    this.present(keep ? computed(() => true) : inPage, panel)
  }
}
