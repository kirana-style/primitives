import {
  DestroyRef,
  Directive,
  effect,
  forwardRef,
  inject,
  input,
  signal as angularSignal,
  untracked,
} from "@angular/core"
import type { OnInit, Signal } from "@angular/core"
import { signal } from "@kirana-ui/core"
import type { Direction } from "@kirana-ui/core"

import { KUI_DIRECTION } from "./direction-token"

/**
 * States the reading direction for the components inside: `<div kuiDirection="rtl" dir="rtl">`.
 * It writes nothing on its element: the `dir` attribute is set with it.
 */
@Directive({
  selector: "[kuiDirection]",
  exportAs: "kuiDirection",
  providers: [{ provide: KUI_DIRECTION, useExisting: forwardRef(() => KuiDirection) }],
})
export class KuiDirection implements OnInit {
  readonly kuiDirection = input<Direction | "" | undefined>()
  // Made with the directive, before its inputs are in: a part inside reads it as it is made.
  readonly direction = signal<Direction>("ltr")

  constructor() {
    effect(() => {
      const next = this.kuiDirection() || "ltr"
      untracked(() => this.direction.set(next))
    })
  }

  ngOnInit(): void {
    this.direction.set(this.kuiDirection() || "ltr")
  }
}

/** The direction the nearest `kuiDirection` states; `ltr` outside one. */
export function injectDirection(): Signal<Direction> {
  const given = inject(KUI_DIRECTION, { optional: true })?.direction
  const value = angularSignal<Direction>(given?.peek() ?? "ltr")
  if (given) inject(DestroyRef).onDestroy(given.subscribe(() => value.set(given.peek())))
  return value.asReadonly()
}
