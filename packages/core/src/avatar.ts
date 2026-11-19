import { flag } from "./part.ts"
import type { Part } from "./part.ts"
import { batch, computed, effect, signal, untracked } from "./reactivity.ts"
import type { ReadonlySignal, Signal } from "./reactivity.ts"

/**
 * Where an avatar's picture is in its loading: `idle` while it has no address, `loading`,
 * then `loaded` or `error`. Base UI's `ImageLoadingStatus`.
 */
export type ImageStatus = "idle" | "loading" | "loaded" | "error"

// oxlint-disable-next-line typescript/no-empty-object-type -- an avatar takes no props of its own yet
export interface AvatarProps {}

/** What an avatar's image part takes besides its address. */
export interface AvatarImageProps {
  /**
   * Called each time the picture's loading status changes: `loading` once it has an address,
   * then `loaded` or `error`; `idle` again when its address is taken away. The same status is
   * on the root, as `data-image-loading-status`.
   */
  onLoadingStatusChange?: ((status: ImageStatus) => void) | undefined
  /**
   * Keeps the image's element in the page while the picture loads, as Base UI's: the element
   * loads it itself (`loading="lazy"` works), its own `src` is the address, and until it has
   * loaded it is `aria-hidden`, with `data-loading` or `data-error` for the design to hide or
   * fade it by. Default: `false`, the element is drawn once the picture has loaded.
   */
  keepMounted?: boolean | undefined
}

/** What an avatar's fallback part takes. */
export interface AvatarFallbackProps {
  /**
   * How long the fallback waits before it shows, in milliseconds, so a picture that loads
   * sooner never lets it be seen. Read once, when the fallback is made. Default: `0`, at once
   * (a server draws it then, and draws nothing while there is a wait).
   */
  delay?: number | undefined
}

/** Whether a fallback is in the page, and the timer behind its `delay`. */
export interface AvatarFallbackPresence {
  /** In the page while the picture has not loaded, once its delay has passed. */
  readonly shown: ReadonlySignal<boolean>
  /** Starts the delay's timer, in a browser. */
  mount(): () => void
}

export interface Avatar {
  /** Where the image is in its loading: the image is drawn once it is `loaded`. */
  readonly status: ReadonlySignal<ImageStatus>
  /** The image's address; its part's adapter writes its own `src` here. */
  readonly source: Signal<string | undefined>
  mount(): () => void
  /** The frame. It says where the picture is in its loading (`data-image-loading-status`). */
  readonly root: Part
  /** The image, drawn by the library once it has loaded. */
  readonly image: Part
  /**
   * The image on an element kept in the page, as Base UI's `keepMounted` image: the element
   * loads the picture itself (lazily, if it says so), its own `src` is the address and is
   * followed as it changes, and its own `load` and `error` say how it went. Until it has
   * loaded it is `aria-hidden`, with `data-loading` while it loads and `data-error` when it
   * cannot; how it looks meanwhile is the design's.
   */
  readonly keptImage: Part
  /** What stands in for the image until it has loaded, or when it cannot. */
  readonly fallback: Part
  /** A fallback's presence: each fallback part makes its own, with its own `delay`. */
  fallbackPresence(props?: AvatarFallbackProps): AvatarFallbackPresence
  /**
   * Tells `told()`'s callback each new status while mounted: what an image part's
   * `onLoadingStatusChange` hears. The status the avatar is in when it mounts is told only
   * when it is not `idle`.
   */
  statusReport(told: () => AvatarImageProps["onLoadingStatusChange"]): { mount(): () => void }
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
  // An image element kept in the page, which loads the picture itself.
  const kept = signal<HTMLImageElement | undefined>(undefined)
  return {
    status,
    source,
    mount: () =>
      effect(() => {
        const address = source.get()
        if (!address) return status.set("idle")
        const element = kept.get()
        if (element) {
          // Its own events say how it went from here; one the browser holds is complete now.
          if (!element.complete) return status.set("loading")
          return status.set(element.naturalWidth > 0 ? "loaded" : "error")
        }
        status.set("loading")
        const image = new Image()
        image.onload = () => status.set("loaded")
        image.onerror = () => status.set("error")
        image.src = address
        // A picture the browser already holds can be complete before anything listened: as
        // Base UI reads it.
        if (image.complete) status.set(image.naturalWidth > 0 ? "loaded" : "error")
        return () => {
          image.onload = image.onerror = null
        }
      }),
    root: {
      props: computed(() => ({ "data-image-loading-status": status.get() })),
      attach: () => NOTHING,
    },
    // The address the controller loaded: the element shows what was loaded, not something newer.
    image: { props: computed(() => ({ src: source.get() })), attach: () => NOTHING },
    keptImage: {
      props: computed(() => {
        const now = status.get()
        return {
          "aria-hidden": now === "loaded" ? undefined : "true",
          "data-loading": flag(now === "loading"),
          "data-error": flag(now === "error"),
        }
      }),
      attach(element) {
        const image = element as HTMLImageElement
        const address = () => image.getAttribute("src") || undefined
        // Only while it has an address: an element with none says nothing of a picture.
        const loaded = () => void (source.peek() && status.set("loaded"))
        const failed = () => void (source.peek() && status.set("error"))
        image.addEventListener("load", loaded)
        image.addEventListener("error", failed)
        const followed = new MutationObserver(() => source.set(address()))
        followed.observe(image, { attributes: true, attributeFilter: ["src"] })
        batch(() => {
          source.set(address())
          kept.set(image)
        })
        return () => {
          followed.disconnect()
          image.removeEventListener("load", loaded)
          image.removeEventListener("error", failed)
          if (kept.peek() === image) kept.set(undefined)
        }
      },
    },
    fallback: { props: NO_PROPS, attach: () => NOTHING },
    fallbackPresence(props = {}) {
      const delay = props.delay ?? 0
      // With no wait it is drawn from the first render, a server's too; with one, only once
      // the timer has run, in a browser. Once it has shown, it never waits again.
      const passed = signal(delay <= 0)
      return {
        shown: computed(() => passed.get() && status.get() !== "loaded"),
        mount() {
          if (passed.peek()) return NOTHING
          const timer = setTimeout(() => passed.set(true), delay)
          return () => clearTimeout(timer)
        },
      }
    },
    statusReport(told) {
      return {
        mount() {
          let first = true
          return effect(() => {
            const now = status.get()
            const quiet = first && now === "idle"
            first = false
            if (!quiet) untracked(() => told()?.(now))
          })
        },
      }
    },
  }
}
