import { Directive, booleanAttribute, inject, input } from "@angular/core"
import type { OnInit } from "@angular/core"
import type { Orientation } from "@kirana-ui/core"
import { createScrollArea } from "@kirana-ui/core/scroll-area"
import type { ScrollArea, ScrollAreaScrollbar } from "@kirana-ui/core/scroll-area"
import { signal } from "@kirana-ui/core"

import { KUI_DIRECTION } from "./direction-token"
import { hostPart, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiScrollArea]", exportAs: "kuiScrollArea" })
export class KuiScrollArea implements OnInit {
  controller!: ScrollArea
  private readonly around = inject(KUI_DIRECTION, { optional: true })
  private readonly put = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createScrollArea(signal({}), { direction: this.around?.direction })
    this.put(this.controller.root)
    this.mount(this.controller)
  }
}

@Directive({ selector: "[kuiScrollAreaViewport]" })
export class KuiScrollAreaViewport implements OnInit {
  private readonly root = inject(KuiScrollArea)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.viewport)
  }
}

@Directive({ selector: "[kuiScrollAreaContent]" })
export class KuiScrollAreaContent implements OnInit {
  private readonly root = inject(KuiScrollArea)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.root.controller.content)
  }
}

/**
 * `<div *kuiScrollAreaScrollbar="'horizontal'">`: in the page while there is something to scroll
 * its way (`vertical` when no orientation is given).
 */
@Directive({ selector: "[kuiScrollAreaScrollbar]" })
export class KuiScrollAreaScrollbar implements OnInit {
  readonly kuiScrollAreaScrollbar = input<Orientation | "">("")
  readonly keepMounted = input(false, {
    alias: "kuiScrollAreaScrollbarKeepMounted",
    transform: booleanAttribute,
  })
  bar!: ScrollAreaScrollbar
  private readonly root = inject(KuiScrollArea)
  private readonly present = presentWhile()

  ngOnInit(): void {
    this.bar = this.root.controller.scrollbar(this.kuiScrollAreaScrollbar() || "vertical")
    const { shown } = this.bar
    this.present(() => shown.get() || this.keepMounted(), this.bar.part)
  }
}

@Directive({ selector: "[kuiScrollAreaThumb]" })
export class KuiScrollAreaThumb implements OnInit {
  private readonly scrollbar = inject(KuiScrollAreaScrollbar)
  private readonly put = hostPart()

  ngOnInit(): void {
    this.put(this.scrollbar.bar.thumb)
  }
}

/** `<div *kuiScrollAreaCorner>`: in the page while both scrollbars are. */
@Directive({ selector: "[kuiScrollAreaCorner]" })
export class KuiScrollAreaCorner implements OnInit {
  private readonly root = inject(KuiScrollArea)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { corner } = this.root.controller
    this.present(corner.shown, corner.part)
  }
}
