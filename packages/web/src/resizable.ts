import { createResizable } from "@kirana-ui/core/resizable"
import type { Resizable, ResizableProps } from "@kirana-ui/core/resizable"

import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const number = (element: HTMLElement, name: string) => {
  const text = element.getAttribute(name)
  return text === null
    ? {}
    : { [name.slice(4).replace(/-./g, (at) => at[1]!.toUpperCase())]: +text }
}

/**
 * `<kui-resizable>` around `kui-part="group"`, its `panel`s (`kui-default-size`,
 * `kui-min-size`, `kui-max-size`, in shares of a hundred) and a `handle` between two
 * (`kui-disabled`). `orientation`, `keyboard-step`, `disabled`; it tells `sizes-change`.
 */
export const tag = defineElement<ResizableProps, Resizable>({
  tag: "kui-resizable",
  props: { orientation: "string", "keyboard-step": "number", disabled: "boolean" },
  create: (props) => createResizable(props),
  changes: { onSizesChange: { event: "sizes-change", prop: "sizes", hold: false } },
  parts: {
    group: (controller) => controller.group,
    panel: (controller, element) =>
      controller.panel(() => ({
        ...number(element, "kui-default-size"),
        ...number(element, "kui-min-size"),
        ...number(element, "kui-max-size"),
      })),
    handle: (controller, element) =>
      controller.handle(() => (element.hasAttribute("kui-disabled") ? { disabled: true } : {})),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-resizable": ElementOf<typeof tag, { "sizes-change": ["onSizesChange", "sizes"] }>
  }
}
