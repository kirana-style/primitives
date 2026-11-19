import { Component, Directive, booleanAttribute, input, signal } from "@angular/core"
import {
  KuiDialog,
  KuiDialogBackdrop,
  KuiDialogClose,
  KuiDialogPopup,
  KuiDialogPortal,
  KuiDialogTitle,
  KuiDialogTrigger,
  KuiOtp,
  KuiTooltip,
  KuiTooltipPositioner,
  hostInputs,
} from "@kirana-ui/angular"

/*
 * A design system of the page's own, built on the primitives as an Angular component library
 * is: each of its directives hosts a primitive (`hostDirectives`), exposing the inputs and
 * outputs its callers set, and gives the primitive what the design system decides
 * (`hostInputs`). Its selectors are its own (`ds…`), apart from the primitives' (`kui…`): two
 * directives with one selector would both match, silently.
 */

/**
 * An element of the page's own with a state of its own, composed as a part is: a directive on
 * the caller's element, whose host bindings join the element's own (its class beside the
 * caller's, both handlers of a click run), its state written as a `data-*` attribute.
 */
@Directive({
  selector: "[dsMark]",
  exportAs: "dsMark",
  host: {
    class: "mark",
    type: "button",
    "[attr.data-active]": "active() ? '' : null",
    "(click)": "active.set(!active())",
  },
})
export class DsMark {
  readonly active = signal(false)
}

/** The dialog's root: the primitive's, with the inputs and the change its callers use. */
@Directive({
  selector: "[dsDialog]",
  hostDirectives: [
    { directive: KuiDialog, inputs: ["kuiId", "open", "defaultOpen"], outputs: ["openChange"] },
  ],
})
export class DsDialog {}

/** What opens it. */
@Directive({ selector: "[dsDialogTrigger]", hostDirectives: [KuiDialogTrigger] })
export class DsDialogTrigger {}

/**
 * What it shows: an attribute cannot put a structural part around its own element, so a
 * component draws the portal, the backdrop and the popup in its template, around what it is
 * given. A part given to it (a title) finds the dialog through the place it is written, not
 * the place it is drawn: it is the dialog's, and it labels the popup.
 */
@Component({
  selector: "[dsDialogContent]",
  imports: [KuiDialogPortal, KuiDialogBackdrop, KuiDialogPopup],
  template: `
    <ng-template kuiDialogPortal>
      <div kuiDialogBackdrop class="backdrop"></div>
      <div kuiDialogPopup class="dialog" [attr.data-testid]="popupTestid()">
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class DsDialogContent {
  readonly popupTestid = input<string>()
}

/** The dialog's title. */
@Directive({ selector: "[dsDialogTitle]", hostDirectives: [KuiDialogTitle] })
export class DsDialogTitle {}

/** What closes it. */
@Directive({ selector: "[dsDialogClose]", hostDirectives: [KuiDialogClose] })
export class DsDialogClose {}

/**
 * A tooltip that opens at once, as the design system decides, and that its caller turns off
 * with an input of the design system's own: both are given to the primitive, the second a
 * signal it follows. A `[delay]` bound on the element still wins.
 */
@Directive({
  selector: "[dsTooltip]",
  hostDirectives: [{ directive: KuiTooltip, inputs: ["kuiId", "delay"] }],
})
export class DsTooltip {
  readonly off = input(false, { transform: booleanAttribute })

  constructor() {
    hostInputs(KuiTooltip, { delay: () => 0, disabled: this.off })
  }
}

/** Where its popup goes: eight pixels from its trigger unless said. */
@Directive({
  selector: "[dsTooltipPositioner]",
  hostDirectives: [{ directive: KuiTooltipPositioner, inputs: ["side", "sideOffset"] }],
})
export class DsTooltipPositioner {
  constructor() {
    hostInputs(KuiTooltipPositioner, { sideOffset: () => 8 })
  }
}

/** A code input that takes any character unless its caller binds `[mode]`. */
@Directive({
  selector: "[dsCode]",
  hostDirectives: [{ directive: KuiOtp, inputs: ["kuiId", "length", "mode"] }],
})
export class DsCode {
  constructor() {
    hostInputs(KuiOtp, { mode: () => "text" })
  }
}
