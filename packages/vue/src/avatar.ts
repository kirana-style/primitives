import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller } from "@kirana-ui/core/avatar"
import { defineComponent, h, watchEffect } from "vue"

import { context, controller, fromSignal, partComponent } from "./runtime.ts"

const scope = context<Controller>("Avatar")
const RootElement = partComponent("AvatarRootElement", "span", () => scope.use().root)
const ImageElement = partComponent("AvatarImageElement", "img", () => scope.use().image)
const FallbackElement = partComponent("AvatarFallbackElement", "span", () => scope.use().fallback)

const Root = defineComponent({
  name: "AvatarRoot",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    scope.provide(controller(createAvatar, () => ({})))
    return () => h(RootElement, attrs, slots)
  },
})

/** The picture: in the page once `src` has loaded. */
const Image = defineComponent({
  name: "AvatarImage",
  inheritAttrs: false,
  props: { src: String },
  setup(props, { attrs }) {
    const made = scope.use()
    watchEffect(() => made.source.set(props.src), { flush: "sync" })
    const status = fromSignal(made.status)
    return () => (status.value === "loaded" ? h(ImageElement, attrs) : null)
  },
})

/** What shows until the picture has loaded, or when it cannot. */
const Fallback = defineComponent({
  name: "AvatarFallback",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const status = fromSignal(scope.use().status)
    return () => (status.value === "loaded" ? null : h(FallbackElement, attrs, slots))
  },
})

export const Avatar = { Root, Image, Fallback }
