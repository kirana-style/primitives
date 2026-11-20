import { Directive, booleanAttribute, inject, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { Orientation } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { signal } from "@kirana-ui/core"

import { KP_DIRECTION } from "./direction-token"
import { hostPart, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kpScrollArea]", exportAs: "kpScrollArea" })
export class KpScrollArea implements OnInit {
  controller!: ScrollArea
  private readonly around = inject(KP_DIRECTION, { optional: true })
  private readonly put = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createScrollArea(signal({}), { direction: this.around?.direction })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kpScrollAreaViewport]" })
export class KpScrollAreaViewport implements OnInit {
  private readonly root = inject(KpScrollArea)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.viewport)
  }
}

@Directive({ selector: "[kpScrollAreaContent]" })
export class KpScrollAreaContent implements OnInit {
  private readonly root = inject(KpScrollArea)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.content)
  }
}

/**
 * `<div *kpScrollAreaScrollbar="'horizontal'">`: in the page while there is something to scroll
 * its way (`vertical` when no orientation is given).
 */
@Directive({ selector: "[kpScrollAreaScrollbar]" })
export class KpScrollAreaScrollbar implements OnInit {
  /** Which way it scrolls: `'horizontal'`, or `'vertical'` when none is given. */
  readonly kpScrollAreaScrollbar = input<Orientation | "">("")
  readonly keepMounted = input(false, {
    alias: "kpScrollAreaScrollbarKeepMounted",
    transform: booleanAttribute,
  })
  bar!: ScrollAreaScrollbar
  private readonly root = inject(KpScrollArea)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.bar = this.root.controller.scrollbar(this.kpScrollAreaScrollbar() || "vertical")
    const { shown } = this.bar
    this.present(() => shown.get() || this.keepMounted(), this.bar.part)
  }
}

@Directive({ selector: "[kpScrollAreaThumb]" })
export class KpScrollAreaThumb implements OnInit {
  private readonly scrollbar = inject(KpScrollAreaScrollbar)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.scrollbar.bar.thumb)
  }
}

/** `<div *kpScrollAreaCorner>`: in the page while both scrollbars are. */
@Directive({ selector: "[kpScrollAreaCorner]" })
export class KpScrollAreaCorner implements OnInit {
  private readonly root = inject(KpScrollArea)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { corner } = this.root.controller
    this.present(corner.shown, corner.part)
  }
}
