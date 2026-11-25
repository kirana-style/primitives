import {
  DestroyRef,
  Directive,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import { computed, defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs } from "@kirana-ui/core/tabs"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kpTabs]", exportAs: "kpTabs" })
export class KpTabs<Value = unknown> implements OnInit {
  readonly value = model<Value | null | undefined>(undefined)
  readonly defaultValue = input<NoInfer<Value> | null>(null)
  readonly orientation = input<Orientation>()
  readonly kpId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: Value; details: ChangeDetails }>()

  controller!: Tabs<Value>
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    orientation: this.orientation(),
    onValueChange: (value: Value, details: ChangeDetails) => {
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
    this.controller = createTabs(this.props(), { direction: this.around?.direction })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kpTabsList]" })
export class KpTabsList implements OnInit {
  readonly activateOnFocus = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly loopFocus = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /**
   * Whether the arrows wrap from the last item to the first.
   * @deprecated Use `loopFocus`, which wins when both are given.
   */
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  private readonly root = inject(KpTabs)
  private readonly part = hostPart()
  private readonly options = () =>
    defined({
      activateOnFocus: this.activateOnFocus(),
      loop: this.loop(),
      loopFocus: this.loopFocus(),
    })

  constructor() {
    effect(() => {
      const next = this.options()
      untracked(() => this.root.controller?.listOptions.set(next))
    })
  }

  ngOnInit(): void {
    this.root.controller.listOptions.set(untracked(this.options))
    this.part(this.root.controller.list)
  }
}

@Directive({ selector: "[kpTabsTab]" })
export class KpTabsTab implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = inject(KpTabs)
  private readonly part = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.part(this.root.controller.tab(this.value(), () => defined(options.get())))
  }
}

@Directive({ selector: "[kpTabsIndicator]" })
export class KpTabsIndicator implements OnInit {
  private readonly root = inject(KpTabs)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.indicator)
  }
}

/**
 * `<div *kpTabsPanel="'account'">`: in the page while its tab is the active one;
 * `*kpTabsPanel="'account'; keepMounted: true"` keeps it, hidden.
 */
@Directive({ selector: "[kpTabsPanel]" })
export class KpTabsPanel implements OnInit {
  /** The value of the tab this is the panel of. */
  readonly kpTabsPanel = input.required<unknown>()
  readonly kpTabsPanelKeepMounted = input(false, { transform: booleanAttribute })
  private readonly root = inject(KpTabs)
  private readonly destroy = inject(DestroyRef)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const panel = this.root.controller.panel(this.kpTabsPanel())
    this.destroy.onDestroy(panel.mount())
    this.present(this.kpTabsPanelKeepMounted() ? computed(() => true) : panel.mounted, panel.part)
  }
}
