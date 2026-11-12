import type { Part } from "./part.ts"
import { computed, effect, signal } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"

export type ImageStatus = "idle" | "loading" | "loaded" | "error"

// oxlint-disable-next-line typescript/no-empty-object-type -- an avatar takes no props of its own yet
export interface AvatarProps {}

export interface Avatar {
  /** Where the image is in its loading: the image is drawn once it is `loaded`. */
  readonly status: ReadonlySignal<ImageStatus>
  /** The image's address; its part's adapter writes its own `src` here. */
  readonly source: Signal<string | undefined>
  mount(): () => void
  readonly root: Part
  readonly image: Part
  /** What stands in for the image until it has loaded, or when it cannot. */
  readonly fallback: Part
}

const NOTHING = () => {}
const NO_PROPS = computed(() => ({}))

/**
 * A picture of a person with something to show in its place: the image is loaded out of sight,
 * and drawn only once it has arrived, so a broken or slow one is never seen.
 */
export function createAvatar(_props: ReadonlySignal<AvatarProps>): Avatar {
  const status = signal<ImageStatus>("idle")
  const source = signal<string | undefined>(undefined)
  return {
    status,
    source,
    mount: () =>
      effect(() => {
        const address = source.get()
        if (!address) return status.set("idle")
        status.set("loading")
        const image = new Image()
        image.onload = () => status.set("loaded")
        image.onerror = () => status.set("error")
        image.src = address
        return () => {
          image.onload = image.onerror = null
        }
      }),
    root: { props: NO_PROPS, attach: () => NOTHING },
    // The address the controller loaded: the element shows what was loaded, not something newer.
    image: { props: computed(() => ({ src: source.get() })), attach: () => NOTHING },
    fallback: { props: NO_PROPS, attach: () => NOTHING },
  }
}
