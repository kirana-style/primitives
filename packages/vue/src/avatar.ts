import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller } from "@kirana-ui/core/avatar"
import { defineComponent, h, watchEffect } from "vue"

import { context, controller, fromSignal, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"avatar">

const scope = context<Controller>("Avatar")
const RootElement = partComponent("AvatarRootElement", "span", () => scope.use().root)
const ImageElement = partComponent("AvatarImageElement", "img", () => scope.use().image)
const FallbackElement = partComponent("AvatarFallbackElement", "span", () => scope.use().fallback)

export type RootProps = PartComponentProps

const Root = defineComponent({
  name: "AvatarRoot",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    scope.provide(controller(createAvatar, () => ({})))
    return () => h(RootElement, attrs, slots)
  },
}) as unknown as PartComponent<"span", State["root"], RootProps>

export interface ImageProps extends PartComponentProps {
  /** The picture's address: the part is in the page once it has loaded. */
  src?: string | undefined
}

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
}) as unknown as PartComponent<"img", State["image"], ImageProps>

export type FallbackProps = PartComponentProps

/** What shows until the picture has loaded, or when it cannot. */
const Fallback = defineComponent({
  name: "AvatarFallback",
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    const status = fromSignal(scope.use().status)
    return () => (status.value === "loaded" ? null : h(FallbackElement, attrs, slots))
  },
}) as unknown as PartComponent<"span", State["fallback"], FallbackProps>

export const Avatar = { Root, Image, Fallback }
