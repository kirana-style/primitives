import { Component, Directive, booleanAttribute, computed, input, signal } from "@angular/core"
import {
  KpDialog,
  KpDialogBackdrop,
  KpDialogClose,
  KpDialogPopup,
  KpDialogPortal,
  KpDialogTitle,
  KpDialogTrigger,
  KpOtp,
  KpTooltip,
  KpTooltipPositioner,
  hostInputs,
} from "@kirana-ui/angular"

/*
 * A design system of the page's own, built on the primitives as an Angular component library
 * is: each of its directives hosts a primitive (`hostDirectives`), exposing the inputs and
 * outputs its callers set, and gives the primitive what the design system decides
 * (`hostInputs`). Its selectors are `kui…`, as a design system that brands itself so names
 * them: `kuiDialog` hosts the primitives' `kpDialog`, and the page imports both. Were they one
 * selector, both directives would match the element, silently, and a component whose template
 * writes its host's selector would match itself there and recurse; the primitives' `kp…` is
 * what keeps a design system's names free.
 */

/**
 * An element of the page's own with a state of its own, composed as a part is: a directive on
 * the caller's element, whose host bindings join the element's own (its class beside the
 * caller's, both handlers of a click run), its state written as a `data-*` attribute.
 */
@Directive({
  selector: "[kuiMark]",
  exportAs: "kuiMark",
  host: {
    class: "mark",
    type: "button",
    "[attr.data-active]": "active() ? '' : null",
    "(click)": "active.set(!active())",
  },
})
export class KuiMark {
  readonly active = signal(false)
}

/** The dialog's root: the primitive's, with the inputs and the change its callers use. */
@Directive({
  selector: "[kuiDialog]",
  hostDirectives: [
    { directive: KpDialog, inputs: ["kpId", "open", "defaultOpen"], outputs: ["openChange"] },
  ],
})
export class KuiDialog {}

/** What opens it. */
@Directive({ selector: "[kuiDialogTrigger]", hostDirectives: [KpDialogTrigger] })
export class KuiDialogTrigger {}

/**
 * What it shows: an attribute cannot put a structural part around its own element, so a
 * component draws the portal, the backdrop and the popup in its template, around what it is
 * given. A part given to it (a title) finds the dialog through the place it is written, not
 * the place it is drawn: it is the dialog's, and it labels the popup.
 */
@Component({
  selector: "[kuiDialogContent]",
  imports: [KpDialogPortal, KpDialogBackdrop, KpDialogPopup],
  template: `
    <ng-template kpDialogPortal>
      <div kpDialogBackdrop class="backdrop"></div>
      <div kpDialogPopup class="dialog" [attr.data-testid]="popupTestid()">
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class KuiDialogContent {
  readonly popupTestid = input<string>()
}

/** The dialog's title. */
@Directive({ selector: "[kuiDialogTitle]", hostDirectives: [KpDialogTitle] })
export class KuiDialogTitle {}

/** What closes it. */
@Directive({ selector: "[kuiDialogClose]", hostDirectives: [KpDialogClose] })
export class KuiDialogClose {}

/**
 * A tooltip that opens at once, as the design system decides, and that its caller turns off
 * with an input of the design system's own: both are given to the primitive, the second a
 * signal it follows. A `[delay]` bound on the element still wins.
 */
@Directive({
  selector: "[kuiTooltip]",
  hostDirectives: [{ directive: KpTooltip, inputs: ["kpId", "delay"] }],
})
export class KuiTooltip {
  readonly off = input(false, { transform: booleanAttribute })

  constructor() {
    hostInputs(KpTooltip, { delay: () => 0, disabled: this.off })
  }
}

/** Where its popup goes: eight pixels from its trigger unless said. */
@Directive({
  selector: "[kuiTooltipPositioner]",
  hostDirectives: [{ directive: KpTooltipPositioner, inputs: ["side", "sideOffset"] }],
})
export class KuiTooltipPositioner {
  constructor() {
    hostInputs(KpTooltipPositioner, { sideOffset: () => 8 })
  }
}

/** A code input that takes any character unless its caller binds `[mode]`. */
@Directive({
  selector: "[kuiCode]",
  hostDirectives: [{ directive: KpOtp, inputs: ["kpId", "length", "mode"] }],
})
export class KuiCode {
  constructor() {
    hostInputs(KpOtp, { mode: () => "text" })
  }
}

/**
 * A code input of digits, built on the design system's own code input (a host inside a host):
 * where it asks for digits its `mode` wins over the one `kuiCode` gives, the outermost host
 * winning, and where it gives `undefined` the host inside it decides. It also gives the code
 * itself, a model: `undefined` leaves the code to the primitive, which then holds what is typed.
 * What `kuiCode` exposes is not exposed again through it (Angular exposes a host directive's
 * own inputs only), so it takes the id and the length itself and gives them.
 */
@Directive({ selector: "[kuiPin]", hostDirectives: [KuiCode] })
export class KuiPin {
  readonly kpId = input<string>()
  readonly length = input<number>()
  readonly digits = input(false, { transform: booleanAttribute })
  readonly code = input<string>()

  constructor() {
    hostInputs(KpOtp, {
      kpId: this.kpId,
      length: this.length,
      mode: computed(() => (this.digits() ? "numeric" : undefined)),
      value: this.code,
    })
  }
}
