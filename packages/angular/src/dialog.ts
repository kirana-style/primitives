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
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createAlertDialog } from "@kirana-ui/core/alert-dialog"
import { createDialog } from "@kirana-ui/core/dialog"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { DrawerSide, DrawerSnapPoint } from "@kirana-ui/core/drawer"
import type { Dialog } from "@kirana-ui/core/dialog"

import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/**
 * On any element, or on `<ng-container>` to draw none. `kuiDrawer` in place of `kuiDialog` is a
 * dialog that comes from an edge and is dragged back to it (`swipeDirection`): its parts are a
 * dialog's (`kuiDialogPopup` …). An alert dialog has a root of its own, `kuiAlertDialog`.
 */
@Directive({ selector: "[kuiDialog],[kuiDrawer]", exportAs: "kuiDialog" })
export class KuiDialog implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  /** Blocks the page behind it and traps focus. Default `true`. */
  readonly modal = input(true, { transform: booleanAttribute })
  /** Whether a press outside closes it. Default `true`. */
  readonly dismissible = input(true, { transform: booleanAttribute })
  /** With `kuiDrawer`: the way it is dragged to close it. Default: `"down"`. */
  readonly swipeDirection = input<DrawerSide>()
  /** With `kuiDrawer`: places it rests at, each the share of itself that shows. */
  readonly snapPoints = input<readonly DrawerSnapPoint[]>()
  /** With `kuiDrawer`: which of them it rests at, `[(snapPoint)]`. */
  readonly snapPoint = model<DrawerSnapPoint | undefined>(undefined)
  /** With `kuiDrawer`: where it opens. Default: the smallest. */
  readonly defaultSnapPoint = input<DrawerSnapPoint>()
  /**
   * With `kuiDrawer`: heard as it is about to rest at another snap point; `details.cancel()` keeps
   * it where it was.
   */
  readonly snapPointChanged = output<{ snapPoint: DrawerSnapPoint; details: ChangeDetails }>()
  readonly kuiId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Dialog
  private readonly drawer = inject(new HostAttributeToken("kuiDrawer"), { optional: true }) !== null
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    modal: this.modal(),
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

  ngOnInit(): void {
    this.controller = this.drawer ? createDrawer(this.props()) : createDialog(this.props())
    this.mount(this.controller)
  }
}

/**
 * `kuiAlertDialog`, on any element or on `<ng-container>`: a dialog that asks for an answer.
 * It is always modal and a press outside it never closes it, so it takes neither `[modal]`
 * nor `[dismissible]`. Its parts are a dialog's (`kuiDialogTrigger`, `kuiDialogPopup` …), which
 * find it as their root.
 */
@Directive({
  selector: "[kuiAlertDialog]",
  exportAs: "kuiDialog",
  providers: [{ provide: KuiDialog, useExisting: forwardRef(() => KuiAlertDialog) }],
})
export class KuiAlertDialog implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Dialog
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
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

  ngOnInit(): void {
    this.controller = createAlertDialog(this.props())
    this.mount(this.controller)
  }
}

/** `<ng-template kuiDialogPortal>` or `*kuiDialogPortal`: its content at the end of the page while open. */
@Directive({ selector: "[kuiDialogPortal]" })
export class KuiDialogPortal implements OnInit {
  private readonly root = inject(KuiDialog)
  private readonly present = presentWhile({ portal: true })

  ngOnInit(): void {
    this.present(this.root.controller.mounted)
  }
}

function part(name: "trigger" | "backdrop" | "popup" | "title" | "description" | "close") {
  const root = inject(KuiDialog)
  const put = hostPart()
  return () => put(root.controller[name])
}

@Directive({ selector: "[kuiDialogTrigger]" })
export class KuiDialogTrigger implements OnInit {
  private readonly init = part("trigger")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiDialogBackdrop]" })
export class KuiDialogBackdrop implements OnInit {
  private readonly init = part("backdrop")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiDialogPopup]" })
export class KuiDialogPopup implements OnInit {
  private readonly init = part("popup")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiDialogTitle]" })
export class KuiDialogTitle implements OnInit {
  private readonly init = part("title")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiDialogDescription]" })
export class KuiDialogDescription implements OnInit {
  private readonly init = part("description")

  ngOnInit(): void {
    this.init()
  }
}

@Directive({ selector: "[kuiDialogClose]" })
export class KuiDialogClose implements OnInit {
  private readonly init = part("close")

  ngOnInit(): void {
    this.init()
  }
}
