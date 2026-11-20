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
import type { OnInit, SimpleChanges } from "@angular/core"
import { defined } from "@kirana-ui/core"
import type { ChangeDetails, Orientation } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type { ToggleGroup } from "@kirana-ui/core/toggle-group"
import { createToolbar } from "@kirana-ui/core/toolbar"
import type { Toolbar } from "@kirana-ui/core/toolbar"

import { KP_DIRECTION } from "./direction-token"
import { hostPart, inputsSignal } from "./runtime"

/** The toolbar a control is an item of, if it is in one. */
export const KP_TOOLBAR = new InjectionToken<{ controller: Toolbar } | null>("KpToolbar")
/** The group a toggle is one of the toggles of, if it is in one. */
export const KP_TOGGLE_GROUP = new InjectionToken<{ controller: ToggleGroup } | null>(
  "KpToggleGroup"
)

@Directive({
  selector: "[kpToolbar]",
  exportAs: "kpToolbar",
  providers: [
    { provide: KP_TOOLBAR, useExisting: forwardRef(() => KpToolbar) },
    // A toggle group around the toolbar is not the group of the toolbar's toggles.
    { provide: KP_TOGGLE_GROUP, useValue: null },
  ],
})
export class KpToolbar implements OnInit {
  readonly orientation = input<Orientation>()
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })

  controller!: Toolbar
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    orientation: this.orientation(),
    loop: this.loop(),
    disabled: this.disabled(),
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createToolbar(this.props(), { direction: this.around?.direction })
    this.put(this.controller.root)
  }
}

function useToolbar(): { controller: Toolbar } {
  const found = inject(KP_TOOLBAR, { optional: true })
  if (!found) throw new Error("A toolbar's part must be inside an element with kpToolbar")
  return found
}

@Directive({ selector: "[kpToolbarButton]" })
export class KpToolbarButton implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = useToolbar()
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.button(() => defined(options.get())))
  }
}

/** `<input kpToolbarInput>`: the arrows are its own until the caret is at an end. */
@Directive({ selector: "[kpToolbarInput]" })
export class KpToolbarInput implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = useToolbar()
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.input(() => defined(options.get())))
  }
}

@Directive({ selector: "[kpToolbarGroup]" })
export class KpToolbarGroup implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  private readonly root = useToolbar()
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller.group(() => defined(options.get())))
  }
}

@Directive({ selector: "[kpToolbarLink]" })
export class KpToolbarLink implements OnInit {
  private readonly root = useToolbar()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.link())
  }
}

@Directive({ selector: "[kpToolbarSeparator]" })
export class KpToolbarSeparator implements OnInit {
  private readonly root = useToolbar()
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.separator)
  }
}

/** Toggles that are one control. Each `kpToggle` with a `value` inside it is one of its toggles. */
@Directive({
  selector: "[kpToggleGroup]",
  exportAs: "kpToggleGroup",
  providers: [{ provide: KP_TOGGLE_GROUP, useExisting: forwardRef(() => KpToggleGroup) }],
})
export class KpToggleGroup<Value = unknown> implements OnInit {
  readonly value = model<readonly Value[] | undefined>(undefined)
  readonly defaultValue = input<readonly Value[]>()
  readonly multiple = input(false, { transform: booleanAttribute })
  readonly disabled = input(false, { transform: booleanAttribute })
  readonly orientation = input<Orientation>()
  readonly loop = input<boolean | undefined, unknown>(undefined, { transform: booleanAttribute })
  readonly valueChanged = output<{ value: Value[]; details: ChangeDetails }>()

  controller!: ToggleGroup<Value>
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly toolbar = inject(KP_TOOLBAR, { optional: true })
  private readonly put = hostPart()
  private readonly props = inputsSignal(this, () => ({
    value: this.value(),
    defaultValue: this.defaultValue(),
    multiple: this.multiple(),
    disabled: this.disabled(),
    orientation: this.orientation(),
    loop: this.loop(),
    onValueChange: (value: Value[], details: ChangeDetails) => {
      this.valueChanged.emit({ value, details })
      if (!details.canceled) {
        this.value.set(value)
        this.props.sync()
      }
    },
  }))

  ngOnChanges(changes: SimpleChanges): void {
    this.props.bound(changes)
  }

  ngOnInit(): void {
    this.controller = createToggleGroup(this.props(), {
      direction: this.around?.direction,
      toolbar: this.toolbar?.controller,
    })
    this.put(this.controller.root)
  }
}
