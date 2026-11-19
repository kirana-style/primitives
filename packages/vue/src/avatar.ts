import { createAvatar } from "@kirana-ui/core/avatar"
import type { Avatar as Controller, ImageStatus } from "@kirana-ui/core/avatar"
import { defineComponent, h, onBeforeUnmount, onMounted, watchEffect } from "vue"
import type { PropType } from "vue"

import { context, controller, fromSignal, partComponent } from "./runtime.ts"
import type { PartComponent, PartComponentProps, StatesOf } from "./runtime.ts"

type State = StatesOf<"avatar">

const scope = context<Controller>("Avatar")
const RootElement = partComponent("AvatarRootElement", "span", () => scope.use().root)
const ImageElement = partComponent("AvatarImageElement", "img", () => scope.use().image)
const KeptImageElement = partComponent("AvatarKeptImageElement", "img", () => scope.use().keptImage)
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
  /**
   * Keeps the element in the page while the picture loads, as Base UI's: it loads the
   * picture itself (`loading="lazy"` works), and until it has loaded it is `aria-hidden`,
   * with `data-loading` or `data-error` for the design to hide or fade it by. Default:
   * `false`, the element is drawn once the picture has loaded.
   */
  keepMounted?: boolean | undefined
}

export type ImageEmits = {
  /**
   * `@loading-status-change`: each time the picture's loading status changes, `loading` once it
   * has an address, then `loaded` or `error`; `idle` again when its address is taken away. The
   * root says the same in `data-image-loading-status`.
   */
  loadingStatusChange: (status: ImageStatus) => void
}

/** Runs something with a `mount()` for the component's life in the page. */
function whileMounted(made: { mount(): () => void }) {
  let stop: (() => void) | undefined
  onMounted(() => {
    stop = made.mount()
  })
  onBeforeUnmount(() => stop?.())
}

/**
 * The picture: in the page once `src` has loaded, or all along with `keep-mounted`.
 * `@loading-status-change` hears its loading.
 */
const Image = defineComponent({
  name: "AvatarImage",
  inheritAttrs: false,
  props: { src: String, keepMounted: Boolean },
  emits: ["loadingStatusChange"],
  setup(props, { attrs, emit }) {
    const made = scope.use()
    watchEffect(() => made.source.set(props.src), { flush: "sync" })
    whileMounted(made.statusReport(() => (status) => emit("loadingStatusChange", status)))
    const status = fromSignal(made.status)
    return () =>
      props.keepMounted
        ? h(KeptImageElement, { ...attrs, src: props.src })
        : status.value === "loaded"
          ? h(ImageElement, attrs)
          : null
  },
}) as unknown as PartComponent<"img", State["image"], ImageProps, ImageEmits>

export interface FallbackProps extends PartComponentProps {
  /**
   * How long to wait before showing, in milliseconds, so a picture that loads sooner never
   * lets the fallback be seen. Read once. Default: `0`, at once.
   */
  delay?: number | undefined
}

/** What shows until the picture has loaded, or when it cannot; after `delay`, when given one. */
const Fallback = defineComponent({
  name: "AvatarFallback",
  inheritAttrs: false,
  props: { delay: { type: Number as PropType<number>, default: undefined as unknown } },
  setup(props, { attrs, slots }) {
    const presence = scope.use().fallbackPresence({ delay: props.delay as number | undefined })
    whileMounted(presence)
    const shown = fromSignal(presence.shown)
    return () => (shown.value ? h(FallbackElement, attrs, slots) : null)
  },
}) as unknown as PartComponent<"span", State["fallback"], FallbackProps>

export const Avatar = { Root, Image, Fallback }
