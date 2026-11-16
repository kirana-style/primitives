import { computed } from "@kirana-ui/core"
import { createListbox } from "@kirana-ui/core/listbox"
import type { Listbox, ListboxGroup, ListboxProps } from "@kirana-ui/core/listbox"

import { list, once, options, valueOf } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"

const groups = new WeakMap<HTMLElement, ListboxGroup>()
let made = 0
const groupOf = (controller: Listbox<string>, element: HTMLElement) =>
  once(groups, partAround(element, "group"), (around) =>
    controller.group(around.getAttribute("kui-id") ?? `kui-group-${++made}`)
  )

type Props = Omit<ListboxProps<string>, "value" | "defaultValue"> & {
  value?: string | readonly string[]
  defaultValue?: string | readonly string[]
}

/**
 * `<kui-listbox>` around `kui-part="root"` and an `item` for each `kui-value`
 * (`kui-disabled`, `kui-label`), which may hold an `indicator`, in the page while the item is
 * chosen. Items may be in a `group` with its `group-label`. `value` and `default-value` (with
 * commas between), `multiple`, `disabled`, `loop`, `name`, `form`; it tells `value-change`.
 */
export const tag = defineElement<Props, Listbox<string>>({
  tag: "kui-listbox",
  props: {
    value: "string",
    "default-value": "string",
    multiple: "boolean",
    disabled: "boolean",
    loop: "boolean",
    name: "string",
    form: "string",
  },
  create: (props) =>
    createListbox<string>(
      computed(() => {
        const own = props.get()
        return { ...own, value: list(own.value), defaultValue: list(own.defaultValue) }
      })
    ),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: {
    root: (controller) => controller.root,
    item: (controller, element) => controller.item(valueOf(element), options(element)),
    indicator(controller, element) {
      const value = valueOf(partAround(element, "item"))
      return { part: controller.indicator(value), mounted: controller.selected(value) }
    },
    group: (controller, element) => groupOf(controller, element)?.root,
    "group-label": (controller, element) => groupOf(controller, element)?.label,
  },
})
