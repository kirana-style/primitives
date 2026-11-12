import { Directive, effect, inject, input, untracked } from "@angular/core"
import type { OnInit } from "@angular/core"
import { computed, signal } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar } from "@kirana-ui/core/avatar"

import { hostPart, mounted, presentWhile } from "./runtime"

@Directive({ selector: "[kuiAvatar]", exportAs: "kuiAvatar" })
export class KuiAvatar implements OnInit {
  controller!: Avatar
  private readonly part = hostPart()
  private readonly mount = mounted()

  ngOnInit(): void {
    this.controller = createAvatar(signal({}))
    this.part(this.controller.root)
    this.mount(this.controller)
  }
}

/** `<img *kuiAvatarImage="address" alt="…">`: in the page once the picture has loaded. */
@Directive({ selector: "[kuiAvatarImage]" })
export class KuiAvatarImage implements OnInit {
  readonly kuiAvatarImage = input<string | undefined>()
  private readonly root = inject(KuiAvatar)
  private readonly present = presentWhile()

  constructor() {
    effect(() => {
      const address = this.kuiAvatarImage()
      untracked(() => this.root.controller?.source.set(address))
    })
  }

  ngOnInit(): void {
    const { controller } = this.root
    controller.source.set(this.kuiAvatarImage())
    this.present(
      computed(() => controller.status.get() === "loaded"),
      controller.image
    )
  }
}

/** `<span *kuiAvatarFallback>`: what shows until the picture has loaded, or when it cannot. */
@Directive({ selector: "[kuiAvatarFallback]" })
export class KuiAvatarFallback implements OnInit {
  private readonly root = inject(KuiAvatar)
  private readonly present = presentWhile()

  ngOnInit(): void {
    const { controller } = this.root
    this.present(
      computed(() => controller.status.get() !== "loaded"),
      controller.fallback
    )
  }
}
