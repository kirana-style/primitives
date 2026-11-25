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
import type { Direction, ReadonlySignal } from "@kirana-ui/core"

import { KP_DIRECTION } from "./direction-token"

/**
 * States the reading direction for the components inside: `<div kpDirection="rtl" dir="rtl">`.
 * It writes nothing on its element: the `dir` attribute is set with it.
 */
@Directive({
  selector: "[kpDirection]",
  exportAs: "kpDirection",
  providers: [{ provide: KP_DIRECTION, useExisting: forwardRef(() => KpDirection) }],
})
export class KpDirection implements OnInit {
  readonly kpDirection = input<Direction | "" | undefined>()
  // Made with the directive, before its inputs are in: a part inside reads it as it is made.
  readonly direction = signal<Direction>("ltr")

  constructor() {
    effect(() => {
      const next = this.kpDirection() || "ltr"
      untracked(() => this.direction.set(next))
    })
  }

  ngOnInit(): void {
    this.direction.set(this.kpDirection() || "ltr")
  }
}

/**
 * The reading direction a `kpDirection` around this directive states, as the signal a controller
 * takes (`{ direction }`); `undefined` outside one, where the controller reads the direction its
 * element is laid out in. For a directive of your own: the library's read the same.
 */
export function injectDirectionAround(): ReadonlySignal<Direction> | undefined {
  return inject(KP_DIRECTION, { optional: true })?.direction
}

/** The direction the nearest `kpDirection` states; `ltr` outside one. */
export function injectDirection(): Signal<Direction> {
  const given = inject(KP_DIRECTION, { optional: true })?.direction
  const value = angularSignal<Direction>(given?.peek() ?? "ltr")
  if (given) inject(DestroyRef).onDestroy(given.subscribe(() => value.set(given.peek())))
  return value.asReadonly()
}
