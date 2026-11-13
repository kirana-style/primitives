import {
  Directive,
  InjectionToken,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type { ToggleGroup } from "@kirana-ui/core/toggle-group"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type { Toolbar } from "@kirana-ui/core/toolbar"

import { KUI_DIRECTION } from "./direction-token"
import { hostPart, inputsSignal } from "./runtime"

/** The toolbar a control is an item of, if it is in one. */
export const KUI_TOOLBAR = new InjectionToken<{ controller: Toolbar } | null>("KuiToolbar")
/** The group a toggle is one of the toggles of, if it is in one. */
export const KUI_TOGGLE_GROUP = new InjectionToken<{ controller: ToggleGroup } | null>(
  "KuiToggleGroup"
)

@Directive({
  selector: "[kuiToolbar]",
  exportAs: "kuiToolbar",
  providers: [
    { provide: KUI_TOOLBAR, useExisting: forwardRef(() => KuiToolbar) },
    // A toggle group around the toolbar is not the group of the toolbar's toggles.
    { provide: KUI_TOGGLE_GROUP, useValue: null },
  ],
})
export class KuiToolbar implements OnInit {
  readonly orientation = input<Orientation>()
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })

  controller!: Toolbar
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
    orientation: this.orientation(),
    loop: this.loop(),
    disabled: this.disabled(),
  }))

  ngOnInit(): void {
    this.controller = createToolbar(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
  }
}

function useToolbar(): { controller: Toolbar } {
  const found = inject(KUI_TOOLBAR, { optional: true })
  if (!found) throw new Error("A toolbar's part must be inside an element with kuiToolbar")
  return found
}

@Directive({ selector: "[kuiToolbarButton]" })
export class KuiToolbarButton implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = useToolbar()
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.button(() => defined(options.get())))
  }
}

/** `<input kuiToolbarInput>`: the arrows are its own until the caret is at an end. */
@Directive({ selector: "[kuiToolbarInput]" })
export class KuiToolbarInput implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = useToolbar()
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.input(() => defined(options.get())))
  }
}

@Directive({ selector: "[kuiToolbarGroup]" })
export class KuiToolbarGroup implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = useToolbar()
  private readonly put = hostPart()
  private readonly options = inputsSignal(() => ({ disabled: this.disabled() }))

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.group(() => defined(options.get())))
  }
}

@Directive({ selector: "[kuiToolbarLink]" })
export class KuiToolbarLink implements OnInit {
  private readonly root = useToolbar()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.link())
  }
}

@Directive({ selector: "[kuiToolbarSeparator]" })
export class KuiToolbarSeparator implements OnInit {
  private readonly root = useToolbar()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.separator)
  }
}

/** Toggles that are one control. Each `kuiToggle` with a `value` inside it is one of its toggles. */
@Directive({
  selector: "[kuiToggleGroup]",
  exportAs: "kuiToggleGroup",
  providers: [{ provide: KUI_TOGGLE_GROUP, useExisting: forwardRef(() => KuiToggleGroup) }],
})
export class KuiToggleGroup implements OnInit {
  readonly value = model<readonly unknown[] | undefined>(undefined)
  readonly defaultValue = input<readonly unknown[]>()
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly orientation = input<Orientation>()
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly valueChanged = output<{ value: unknown[]; details: ChangeDetails }>()

  controller!: ToggleGroup
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly toolbar = inject(KUI_TOOLBAR, { optional: true })
  private readonly put = hostPart()
  private readonly props = inputsSignal(() => ({
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

  ngOnInit(): void {
    this.controller = createToggleGroup(this.props(), {
      direction: this.around?.direction,
      toolbar: this.toolbar?.controller,
    })
    this.put(this.controller.root)
  }
}
