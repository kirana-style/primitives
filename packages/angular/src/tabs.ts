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
import type { OnInit } from "@angular/core"
import { computed, defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createTabs } from "@kirana-ui/core/tabs"
import type { Tabs } from "@kirana-ui/core/tabs"

import { KUI_DIRECTION } from "./direction-token"
import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiTabs]", exportAs: "kuiTabs" })
export class KuiTabs implements OnInit {
  readonly value = model<unknown>(undefined)
  readonly defaultValue = input<unknown>(null)
  readonly orientation = input<Orientation>()
  readonly kuiId = input<string>()
  /** The change with why it happened; `details.cancel()` keeps the value. */
  readonly valueChanged = output<{ value: unknown; details: ChangeDetails }>()

  controller!: Tabs
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    value: this.value(),
    defaultValue: this.defaultValue(),
    orientation: this.orientation(),
    onValueChange: (value: unknown, details: ChangeDetails) => {
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
    this.controller = createTabs(this.props(), { direction: this.around?.direction })
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiTabsList]" })
export class KuiTabsList implements OnInit {
  readonly activateOnFocus = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  private readonly root = inject(KuiTabs)
  private readonly part = hostPart()
  private readonly options = () =>
    defined({ activateOnFocus: this.activateOnFocus(), loop: this.loop() })

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

@Directive({ selector: "[kuiTabsTab]" })
export class KuiTabsTab implements OnInit {
  readonly value = input.required<unknown>()
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = inject(KuiTabs)
  private readonly part = hostPart()
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    this.part(this.root.controller.tab(this.value(), () => defined(options.get())))
  }
}

@Directive({ selector: "[kuiTabsIndicator]" })
export class KuiTabsIndicator implements OnInit {
  private readonly root = inject(KuiTabs)
  private readonly part = hostPart()

  ngOnInit(): void {
    this.part(this.root.controller.indicator)
  }
}

/**
 * `<div *kuiTabsPanel="'account'">`: in the page while its tab is the active one;
 * `*kuiTabsPanel="'account'; keepMounted: true"` keeps it, hidden.
 */
@Directive({ selector: "[kuiTabsPanel]" })
export class KuiTabsPanel implements OnInit {
  readonly kuiTabsPanel = input.required<unknown>()
  readonly kuiTabsPanelKeepMounted = input(false, { transform: booleanAttribute })
  private readonly root = inject(KuiTabs)
  private readonly destroy = inject(DestroyRef)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const panel = this.root.controller.panel(this.kuiTabsPanel())
    this.destroy.onDestroy(panel.mount())
    this.present(this.kuiTabsPanelKeepMounted() ? computed(() => true) : panel.mounted, panel.part)
  }
}
