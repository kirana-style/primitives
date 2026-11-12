import type { Part } from "./part.ts"
import { computed } from "./reactivity.ts"
import type { ReadonlySignal } from "./reactivity.ts"
import type { Orientation } from "./services/roving.ts"

export interface SeparatorProps {
  orientation?: Orientation | undefined
}

export interface Separator {
  mount(): () => void
  readonly root: Part
}

const NOTHING = () => {}

/** A line between two groups of content, which assistive technology hears as one. */
export function createSeparator(props: ReadonlySignal<SeparatorProps>): Separator {
  return {
    mount: () => NOTHING,
    root: {
      props: computed(() => {
        const orientation = props.get().orientation ?? "horizontal"
        return {
          role: "separator",
          "aria-orientation": orientation,
          "data-orientation": orientation,
        }
      }),
      attach: () => NOTHING,
    },
  }
}
