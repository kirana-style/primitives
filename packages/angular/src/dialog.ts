import { Directive, booleanAttribute, inject, input, model, output } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { ChangeDetails } from "@kirana-ui/core"
import { createDialog } from "@kirana-ui/core/dialog"
import type { Dialog } from "@kirana-ui/core/dialog"

import { KuiIds, hostPart, inputsSignal, mounted, presentWhile } from "./runtime"

/** On any element, or on `<ng-container>` to draw none. */
@Directive({ selector: "[kuiDialog]", exportAs: "kuiDialog" })
export class KuiDialog implements OnInit {
  readonly open = model<boolean | undefined>(undefined)
  readonly defaultOpen = input(false, { transform: booleanAttribute })
  readonly modal = input(true, { transform: booleanAttribute })
  readonly dismissible = input(true, { transform: booleanAttribute })
  readonly kuiId = input<string>()
  readonly openChanged = output<{ open: boolean; details: ChangeDetails }>()

  controller!: Dialog
  private readonly generated = inject(KuiIds).make()
  private readonly props = inputsSignal(() => ({
    id: this.kuiId() ?? this.generated,
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    modal: this.modal(),
    dismissible: this.dismissible(),
    onOpenChange: (open: boolean, details: ChangeDetails) => {
      this.openChanged.emit({ open, details })
      if (!details.canceled) this.open.set(open)
    },
  }))
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createDialog(this.props())
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
