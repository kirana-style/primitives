import { signal } from "@kirana-ui/core"
import type { Direction } from "@kirana-ui/core"
import { createDirection } from "@kirana-ui/core/direction"
import { defineComponent } from "vue"
import type { PropType, ShallowRef } from "vue"

import { provideDirection, useDirectionAround } from "./direction-context.ts"
import { controller, fromSignal } from "./runtime.ts"

/**
 * States the reading direction for the components inside. It draws nothing: set the page's own
 * `dir` attribute with it.
 */
export const DirectionProvider = defineComponent({
  name: "DirectionProvider",
  props: { direction: String as PropType<Direction> },
  setup(props, { slots }) {
    provideDirection(controller(createDirection, () => ({ direction: props.direction })).direction)
    return () => slots.default?.()
  },
})

/** The direction the nearest provider states; `ltr` outside one. */
export function useDirection(): Readonly<ShallowRef<Direction>> {
  return fromSignal(useDirectionAround() ?? signal<Direction>("ltr"))
}
