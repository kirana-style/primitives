import { InjectionToken } from "@angular/core"
import type { Direction, ReadonlySignal } from "@kirana-ui/core"

/** The reading direction a provider states, if a component is inside one. */
export const KUI_DIRECTION = new InjectionToken<{ readonly direction: ReadonlySignal<Direction> }>(
  "KuiDirection"
)
