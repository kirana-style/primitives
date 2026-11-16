import { Directive, forwardRef, input } from "@angular/core"

import { KUI_PORTAL_CONTAINER } from "./runtime"

/**
 * `<ng-container kuiPortalProvider [container]="element">`: says where every popup inside
 * it is drawn, the popups those open included: an element of the page (a shadow root's host,
 * a full-screen element) in place of `<body>`.
 */
@Directive({
  selector: "[kuiPortalProvider]",
  providers: [
    {
      provide: KUI_PORTAL_CONTAINER,
      useFactory: (provider: KuiPortalProvider) => () => provider.container(),
      deps: [forwardRef(() => KuiPortalProvider)],
    },
  ],
})
export class KuiPortalProvider {
  /** Where the popups inside are drawn; the end of `<body>` while it is not given. */
  readonly container = input<HTMLElement | null>()
}
