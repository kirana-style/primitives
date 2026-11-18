import { computed } from "@kirana-ui/core"
import { createAccordion } from "@kirana-ui/core/accordion"
import type { Accordion, AccordionItem, AccordionProps } from "@kirana-ui/core/accordion"

import { list, ownValue } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

// An item's parts share the item: made when the first of them is met.
const items = new WeakMap<HTMLElement, AccordionItem>()

function itemOf(controller: Accordion<string>, element: HTMLElement): AccordionItem | undefined {
  const around = partAround(element, "item")
  if (!around) return undefined
  let item = items.get(around)
  if (!item) {
    item = controller.item(around.getAttribute("kui-value") ?? ownValue(around), () =>
      around.hasAttribute("kui-disabled") ? { disabled: true } : {}
    )
    items.set(around, item)
  }
  return item
}

type Props = Omit<AccordionProps<string>, "value" | "defaultValue"> & {
  value?: string | readonly string[]
  defaultValue?: string | readonly string[]
}

/**
 * `<kui-accordion>` around `kui-part="root"` and its `item`s, each with a `header`, a
 * `trigger` button and a `panel` that is in the page while its item is open. An item's
 * `kui-value` tells it from the others; an item that is given none makes its own.
 * `value` and `default-value` (the open items, with commas between), `multiple`, `disabled`,
 * `orientation`, `loop`; it tells `value-change`.
 */
export const tag = defineElement<Props & { id: string }, Accordion<string>>({
  tag: "kui-accordion",
  props: {
    value: "string",
    "default-value": "string",
    multiple: "boolean",
    disabled: "boolean",
    orientation: "string",
    loop: "boolean",
  },
  create: (props) =>
    createAccordion<string>(
      computed(() => {
        const own = props.get()
        return { ...own, value: list(own.value), defaultValue: list(own.defaultValue) }
      })
    ),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: {
    root: (controller) => controller.root,
    item(controller, element) {
      const item = itemOf(controller, element)
      return item && { part: item.root, mount: () => item.mount() }
    },
    header: (controller, element) => itemOf(controller, element)?.header,
    trigger: (controller, element) => itemOf(controller, element)?.trigger,
    panel(controller, element) {
      const item = itemOf(controller, element)
      return item && { mounted: item.mounted, part: item.panel }
    },
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-accordion": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
