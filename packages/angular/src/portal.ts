import { Directive, forwardRef, input } from "@angular/core"

import { KP_PORTAL_CONTAINER } from "./runtime"

/**
 * `<ng-container kpPortalProvider [container]="element">`: says where every popup inside
 * it is drawn, the popups those open included: an element of the page (a shadow root's host,
 * a full-screen element) in place of `<body>`.
 */
@Directive({
  selector: "[kpPortalProvider]",
  providers: [
    {
      provide: KP_PORTAL_CONTAINER,
      useFactory: (provider: KpPortalProvider) => () => provider.container(),
      deps: [forwardRef(() => KpPortalProvider)],
    },
  ],
})
export class KpPortalProvider {
  /** Where the popups inside are drawn; the end of `<body>` while it is not given. */
  readonly container = input<HTMLElement | null>()
}
