import {
  Directive,
  HostAttributeToken,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  model,
  output,
} from "@angular/core"
import type { OnInit, SimpleChanges } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { DrawerSide, DrawerSnapPoint } from "@kirana-ui/core/drawer"
import type { Dialog } from "@kirana-ui/core/dialog"

import { KP_DIRECTION } from "./direction-token"
import { KpIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/**
 * On any element, or on `<ng-container>` to draw none. `kpDrawer` in place of `kpDialog` is a
 * dialog that comes from an edge and is dragged back to it (`swipeDirection`): its parts are a
 * dialog's (`kpDialogPopup` …). An alert dialog has a root of its own, `kpAlertDialog`.
 */
@Directive({ selector: "[kpDialog],[kpDrawer]", exportAs: "kpDialog" })
export class KpDialog implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  /** Blocks the page behind it and traps focus. Default `true`. */
  readonly modal = input(true, { transform: booleanAttribute })
  /**
   * Keeps it open when the pointer presses outside it. Default `false`. Escape always closes
   * it: a caller who must keep it open cancels the change whose `details.reason` is
   * `"escape-key"`.
   */
  readonly disablePointerDismissal = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /**
   * Whether a press outside closes it. Default `true`.
   * @deprecated Base UI's name is `[disablePointerDismissal]`, the other way round, which wins
   * when both are given.
   */
  readonly closeOnOutsidePress = input<boolean | undefined, unknown>(undefined, {
    transform: booleanAttribute,
  })
  /**
   * Whether a press outside closes it. Default `true`.
   * @deprecated Base UI's name is `[disablePointerDismissal]`, the other way round, which wins
   * over this and over `[closeOnOutsidePress]`.
   */
  readonly dismissible = input(true, { transform: booleanAttribute })
  /** With `kpDrawer`: the way it is dragged to close it. Default: `"down"`. */
  readonly swipeDirection = input<DrawerSide>()
  /** With `kpDrawer`: places it rests at, each the share of itself that shows. */
  readonly snapPoints = input<readonly DrawerSnapPoint[]>()
  /** With `kpDrawer`: which of them it rests at, `[(snapPoint)]`. */
  readonly snapPoint = model<DrawerSnapPoint | undefined>(undefined)
  /** With `kpDrawer`: where it opens. Default: the smallest. */
  readonly defaultSnapPoint = input<DrawerSnapPoint>()
  /**
   * With `kpDrawer`: heard as it is about to rest at another snap point; `details.cancel()` keeps
   * it where it was.
   */
  readonly snapPointChanged = output<{ snapPoint: DrawerSnapPoint; details: ChangeDetails }>()
  readonly kpId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Dialog
  private readonly drawer = inject(new HostAttributeToken("kpDrawer"), { optional: true }) !== null
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    modal: this.modal(),
    disablePointerDismissal: this.disablePointerDismissal(),
    closeOnOutsidePress: this.closeOnOutsidePress(),
    dismissible: this.dismissible(),
    swipeDirection: this.swipeDirection(),
    snapPoints: this.snapPoints(),
    snapPoint: this.snapPoint(),
    defaultSnapPoint: this.defaultSnapPoint(),
    onSnapPointChange: (snapPoint: DrawerSnapPoint, details: ChangeDetails) => {
      this.snapPointChanged.emit({ snapPoint, details })
      // Written back only to a caller who holds it.
      if (!details.canceled && this.snapPoint() !== undefined) {
        this.snapPoint.set(snapPoint)
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
    const around = { direction: this.around?.direction }
    this.controller = this.drawer
      ? createDrawer(this.props(), around)
      : createDialog(this.props(), around)
    this.mount(this.controller)
  }
}

/**
 * `kpAlertDialog`, on any element or on `<ng-container>`: a dialog that asks for an answer.
 * It is always modal and a press outside it never closes it, so it takes neither `[modal]`
 * nor `[disablePointerDismissal]`. Its parts are a dialog's (`kpDialogTrigger`, `kpDialogPopup` …), which
 * find it as their root.
 */
@Directive({
  selector: "[kpAlertDialog]",
  exportAs: "kpDialog",
  providers: [{ provide: KpDialog, useExisting: forwardRef(() => KpAlertDialog) }],
})
export class KpAlertDialog implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly kpId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Dialog
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly generated = inject(KpIds).make()
  private readonly props = inputsSignal(this, () => ({
    id: this.kpId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
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
    this.controller = createAlertDialog(this.props(), { direction: this.around?.direction })
    this.mount(this.controller)
  }
}

/** `<ng-template kpDialogPortal>` or `*kpDialogPortal`: its content at the end of the page while open. */
@Directive({ selector: "[kpDialogPortal]" })
export class KpDialogPortal implements OnInit {
  private readonly root = inject(KpDialog)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

function part(name: "backdrop" | "viewport" | "popup" | "title" | "description") {
  const root = inject(KpDialog)
  const put = hostPart()
  return () => put(root.controller[name])
}

/** A trigger or a close button, with its own `[disabled]`. */
@Directive()
abstract class DialogButton implements OnInit {
  readonly disabled = input(false, { transform: booleanAttribute })
  protected abstract readonly which: "triggerPart" | "closePart"
  private readonly root = inject(KpDialog)
  private readonly put = hostPart()
  private readonly options = inputsSignal(this, () => ({ disabled: this.disabled() }))

  ngOnChanges(changes: SimpleChanges): void {
    this.options.bound(changes)
  }

  ngOnInit(): void {
    const options = this.options()
    this.put(this.root.controller[this.which](() => options.get()))
  }
}

@Directive({ selector: "[kpDialogTrigger]" })
export class KpDialogTrigger extends DialogButton {
  protected readonly which = "triggerPart"
}

@Directive({ selector: "[kpDialogBackdrop]" })
export class KpDialogBackdrop implements OnInit {
  private readonly init = part("backdrop")

  ngOnInit(): void {
    this.init()
  }
}

/**
 * What a long dialog scrolls in, around its popup: it may be left out. A dialog's and an alert
 * dialog's; a drawer lies at an edge of the page and has none.
 */
@Directive({ selector: "[kpDialogViewport]" })
export class KpDialogViewport implements OnInit {
  private readonly init = part("viewport")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpDialogPopup]" })
export class KpDialogPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpDialogTitle]" })
export class KpDialogTitle implements OnInit {
  private readonly init = part("title")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpDialogDescription]" })
export class KpDialogDescription implements OnInit {
  private readonly init = part("description")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kpDialogClose]" })
export class KpDialogClose extends DialogButton {
  protected readonly which = "closePart"
}
