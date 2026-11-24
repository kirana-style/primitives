import { Directive, TemplateRef, effect, inject, input, output, untracked } from "@angular/core"
import type { OnInit } from "@angular/core"
import { computed, signal } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar, ImageStatus } from "@kirana-ui/core/avatar"

import { hostPart, mounted, presentWhile } from "./runtime"

/**
 * `<span kpAvatar>`: the frame. `(loadingStatusChanged)` hears its picture's loading, in either
 * of the image's forms (a structural directive's own outputs cannot be bound from its element).
 */
@Directive({ selector: "[kpAvatar]", exportAs: "kpAvatar" })
export class KpAvatar implements OnInit {
  /**
   * Each time the picture's loading status changes: `loading` once it has an address, then
   * `loaded` or `error`; `idle` again when its address is taken away. Base UI's
   * `onLoadingStatusChange`; the root says the same in `data-image-loading-status`.
   */
  readonly loadingStatusChanged = output<ImageStatus>()
  controller!: Avatar
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createAvatar(signal({}))
    this.part(this.controller.root)
    this.mount(this.controller)
    this.mount(
      this.controller.statusReport(() => (status) => this.loadingStatusChanged.emit(status))
    )
  }
}

/**
 * The picture, in either of two forms. `<img *kpAvatarImage="address" alt="…">` is in the page
 * once the picture has loaded. `<img kpAvatarImage [src]="address" alt="…">` is the caller's own
 * element, kept in the page as Base UI's `keepMounted` image: it loads the picture itself
 * (`loading="lazy"` works), its own `src` is the address and is followed as it changes, and
 * until it has loaded it is `aria-hidden`, with `data-loading` or `data-error` for the design to
 * hide or fade it by. The root's `(loadingStatusChanged)` hears the loading either way. Write the
 * structural form when the picture only has to appear once it is there; the attribute form when
 * the element must be in the page from the start: to fade the picture in, to load it lazily, or
 * to keep its attributes and place while it loads.
 */
@Directive({ selector: "[kpAvatarImage]" })
export class KpAvatarImage implements OnInit {
  /** The picture's address, in the structural form: the element is in the page once it has loaded. */
  readonly kpAvatarImage = input<string | undefined>()
  private readonly root = inject(KpAvatar)
  // On an `<ng-template>` (the `*` form) the part is drawn once loaded; on an element, it is
  // that element, which says its own address.
  private readonly structural = inject(TemplateRef, { optional: true }) !== null
  private readonly present = this.structural ? presentWhile() : undefined
  private readonly host = this.structural ? undefined : hostPart()

  constructor() {
    effect(() => {
      const address = this.kpAvatarImage()
      if (this.structural) untracked(() => this.root.controller?.source.set(address))
    })
  }

  ngOnInit(): void {
    const { controller } = this.root
    if (this.host) return this.host(controller.keptImage)
    controller.source.set(this.kpAvatarImage())
    this.present?.(
      computed(() => controller.status.get() === "loaded"),
      controller.image
    )
  }
}

/**
 * `<span *kpAvatarFallback>`: what shows until the picture has loaded, or when it cannot.
 * `{ delay: 600 }` waits that many milliseconds first, so a picture that loads sooner never lets
 * it be seen.
 */
@Directive({ selector: "[kpAvatarFallback]" })
export class KpAvatarFallback implements OnInit {
  /**
   * Its options: `{ delay: 600 }` waits that many milliseconds before showing. Read once.
   * Default: no wait.
   */
  readonly kpAvatarFallback = input<{ delay?: number | undefined } | "">("")
  private readonly root = inject(KpAvatar)
  private readonly present = presentWhile()
  private readonly mount = mounted()

  ngOnInit(): void {
    const options = this.kpAvatarFallback()
    const presence = this.root.controller.fallbackPresence(
      typeof options === "object" ? options : {}
    )
    this.mount(presence)
    this.present(presence.shown, this.root.controller.fallback)
  }
}
