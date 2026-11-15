import { details, flag } from "./part.ts"
import type { ChangeDetails, Part } from "./part.ts"
import { computed, signal } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"

export interface MessageScrollerProps {
  id: string
  /** Where it begins: at the newest message (the default), or at the first. */
  initial?: "bottom" | "top" | undefined
  /** How near the end counts as at it, in pixels. Default: 24. */
  threshold?: number | undefined
  /** Heard when it comes to the end or leaves it. */
  onAtBottomChange?: ((atBottom: boolean, details: ChangeDetails) => void) | undefined
}

export interface MessageScroller {
  /** Whether the newest message is in view. */
  readonly atBottom: ReadonlySignal<boolean>
  /** Goes to the newest message, and follows what comes after. */
  scrollToBottom(details?: ChangeDetails): void
  mount(): () => void
  readonly root: Part
  /** What scrolls. */
  readonly viewport: Part
  /** The messages: what grows. */
  readonly content: Part
  /** A button that goes to the newest message; it is inert while that is in view. */
  readonly button: Part
}

const NOTHING = () => {}

/**
 * A conversation that stays at its newest message while one is written, and stops following
 * the moment the reader scrolls up to read. It follows by scrolling its own box when what is
 * in it is written or grows; nothing is observed on a timer, and no message is measured.
 */
export function createMessageScroller(
  props: ReadonlySignal<MessageScrollerProps>
): MessageScroller {
  const id = props.peek().id
  const atBottom = signal(props.peek().initial !== "top")
  // Whether what comes next is followed: until the reader goes up.
  let following = props.peek().initial !== "top"
  let view: HTMLElement | undefined
  let last = 0

  const far = () => (view ? view.scrollHeight - view.scrollTop - view.clientHeight : 0)

  function say(next: boolean, by: ChangeDetails) {
    if (atBottom.peek() === next) return
    atBottom.set(next)
    props.peek().onAtBottomChange?.(next, by)
  }

  function follow() {
    if (!view || !following) return
    // At once: what is being written is read as it comes, not chased.
    view.scrollTo({ top: view.scrollHeight, behavior: "instant" })
    last = view.scrollTop
  }

  function scrollToBottom(by: ChangeDetails = details("scroll-to-bottom")) {
    if (!view) return
    following = true
    // How it gets there is the design's (`scroll-behavior`), and the person's (reduced motion).
    view.scrollTo({ top: view.scrollHeight })
    if (far() <= (props.peek().threshold ?? 24)) say(true, by)
  }

  return {
    atBottom,
    scrollToBottom,
    mount: () => NOTHING,
    root: {
      props: computed(() => ({ id, "data-at-bottom": flag(atBottom.get()) })),
      attach: () => NOTHING,
    },
    viewport: {
      props: computed(() => ({
        id: `${id}-viewport`,
        // A conversation is a log: what is added is read, and a box that scrolls is reached
        // by the keyboard.
        role: "log",
        tabindex: "0",
        "data-at-bottom": flag(atBottom.get()),
      })),
      attach(element) {
        view = element
        const scrolled = (event: Event) => {
          const top = element.scrollTop
          const near = far() <= (props.peek().threshold ?? 24)
          // Up, and away from the end: the reader is reading. Down to the end: following again.
          if (near) following = true
          else if (top < last - 1) following = false
          last = top
          say(near, details("scroll", event))
        }
        element.addEventListener("scroll", scrolled, { passive: true })
        // Taller or shorter (a keyboard opens under it), the end is somewhere else.
        const observer = new ResizeObserver(follow)
        observer.observe(element)
        follow()
        return () => {
          element.removeEventListener("scroll", scrolled)
          observer.disconnect()
          if (view === element) view = undefined
        }
      },
    },
    content: {
      props: computed(() => ({})),
      attach(element) {
        // What is written is followed as it is written, before it is drawn: a message added,
        // a word added to one. A browser reports a new size only when it next draws, which
        // is a frame late, and not at all while it draws nothing.
        const written = new MutationObserver(follow)
        written.observe(element, { childList: true, subtree: true, characterData: true })
        // And what grows with nothing written: a picture that loads, a font that arrives.
        const observer = new ResizeObserver(follow)
        observer.observe(element)
        return () => {
          written.disconnect()
          observer.disconnect()
        }
      },
    },
    button: {
      props: computed(() => ({
        type: "button",
        "aria-controls": `${id}-viewport`,
        // Nothing to press while the newest message is in view; a design shows it or not.
        inert: atBottom.get() ? "" : undefined,
        "data-at-bottom": flag(atBottom.get()),
        onClick: (event: Event) => scrollToBottom(details("button-press", event)),
      })),
      attach: () => NOTHING,
    },
  }
}
