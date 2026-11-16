import { computed, effect } from "@kirana-ui/core"
import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar } from "@kirana-ui/core/avatar"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-avatar>` around `kui-part="root"`, an `image` (an `<img>`, in the page once the
 * picture has loaded) and a `fallback`, in the page until then. `src`: the picture's address,
 * on the component, since the image is not in the page to be given one.
 */
export const tag = defineElement<{ id: string; src?: string }, Avatar & { mount(): () => void }>({
  tag: "kui-avatar",
  props: { src: "string" },
  create(props) {
    const avatar = createAvatar(props)
    return {
      ...avatar,
      mount() {
        const stops = [effect(() => avatar.source.set(props.get().src)), avatar.mount()]
        return () => stops.forEach((stop) => stop())
      },
    }
  },
  changes: {},
  parts: {
    root: (controller) => controller.root,
    image: (controller) => ({
      part: controller.image,
      mounted: computed(() => controller.status.get() === "loaded"),
    }),
    fallback: (controller) => ({
      part: controller.fallback,
      mounted: computed(() => controller.status.get() !== "loaded"),
    }),
  },
})
