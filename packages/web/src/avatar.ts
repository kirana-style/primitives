import { computed, effect } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar, AvatarFallbackPresence, AvatarImageProps } from "@kirana-ui/core/avatar"

import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

// One presence per fallback element: its delay is counted once.
const fallbacks = new WeakMap<HTMLElement, AvatarFallbackPresence>()

/**
 * `<kui-avatar>` around `kui-part="root"`, an `image` (an `<img>`, in the page once the
 * picture has loaded) and a `fallback`, in the page until then; `kui-delay="600"` on the
 * fallback waits that many milliseconds first. `src`: the picture's address, on the component,
 * since the image is not in the page to be given one. With `kui-keep-mounted` the image stays
 * in the page, as Base UI's `keepMounted` image: its own `src` is the address, it loads the
 * picture itself, and it is `aria-hidden` until it has (`data-loading`, `data-error`). It
 * tells `loading-status-change` (`detail.status`) as the picture loads.
 */
export const tag = defineElement<
  { id: string; src?: string } & AvatarImageProps,
  Avatar & { mount(): () => void }
>({
  tag: "kui-avatar",
  props: { src: "string" },
  create(props) {
    const avatar = createAvatar(props)
    const report = avatar.statusReport(() => props.peek().onLoadingStatusChange)
    return {
      ...avatar,
      mount() {
        // An image kept in the page says its own address: a component given none leaves it.
        let given = false
        const stops = [
          effect(() => {
            const { src } = props.get()
            if (src === undefined && !given) return
            given = src !== undefined
            avatar.source.set(src)
          }),
          avatar.mount(),
          report.mount(),
        ]
        return () => stops.forEach((stop) => stop())
      },
    }
  },
  changes: {
    onLoadingStatusChange: { event: "loading-status-change", prop: "status", hold: false },
  },
  parts: {
    root: (controller) => controller.root,
    image: (controller, element) =>
      element.hasAttribute("kui-keep-mounted")
        ? controller.keptImage
        : { part: controller.image, mounted: computed(() => controller.status.get() === "loaded") },
    fallback(controller, element) {
      let presence = fallbacks.get(element)
      if (!presence) {
        const delay = Number(element.getAttribute("kui-delay")) || 0
        presence = controller.fallbackPresence({ delay })
        fallbacks.set(element, presence)
      }
      return { part: controller.fallback, mounted: presence.shown, mount: presence.mount }
    },
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-avatar": ElementOf<
      typeof tag,
      { "loading-status-change": ["onLoadingStatusChange", "status"] }
    >
  }
}
