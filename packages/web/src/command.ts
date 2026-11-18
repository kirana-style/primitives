import { createCommand } from "@kirana-ui/core/command"
import type { Command, CommandGroup, CommandProps } from "@kirana-ui/core/command"

import { list, once, valueOf } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const groups = new WeakMap<HTMLElement, CommandGroup>()
let made = 0
const groupOf = (controller: Command, element: HTMLElement | null) =>
  once(groups, element, (group) =>
    controller.group(group.getAttribute("kui-id") ?? `kui-command-group-${++made}`)
  )

/**
 * `<kui-command>` around `kui-part="root"`, an `input` and a `list` of `item`s (`kui-value`,
 * `kui-disabled`, `kui-label`, `kui-keywords` with commas between, `kui-id`), in `group`s
 * with a `group-heading` and `separator`s (`kui-always-render`) if it has them, and an
 * `empty` part drawn while nothing matches. What is typed filters the list; Enter or a press
 * runs an item. `input-value`, `default-input-value`, `loop`, `disabled`; `filter` as a
 * property; it tells `input-value-change` and `select`.
 */
export const tag = defineElement<CommandProps, Command>({
  tag: "kui-command",
  props: {
    "input-value": "string",
    "default-input-value": "string",
    loop: "boolean",
    disabled: "boolean",
  },
  properties: ["filter"],
  create: (props) => createCommand(props),
  changes: {
    onInputValueChange: { event: "input-value-change", prop: "inputValue" },
    onSelect: { event: "select", prop: "value", hold: false },
  },
  parts: {
    root: (controller) => controller.root,
    input: (controller) => controller.input,
    list: (controller) => controller.list,
    empty: (controller) => ({ part: controller.emptyPart, mounted: controller.empty }),
    group: (controller, element) => groupOf(controller, element)?.part,
    "group-heading": (controller, element) =>
      groups.get(partAround(element, "group")!)?.heading ?? controller.heading,
    item(controller, element) {
      const id = element.getAttribute("kui-id") ?? `kui-command-item-${++made}`
      return controller.item(
        valueOf(element),
        () => ({
          id,
          ...(element.hasAttribute("kui-disabled") ? { disabled: true } : {}),
          ...(element.hasAttribute("kui-label")
            ? { label: element.getAttribute("kui-label")! }
            : {}),
          ...(element.hasAttribute("kui-keywords")
            ? { keywords: list(element.getAttribute("kui-keywords"))! }
            : {}),
        }),
        groupOf(controller, element.parentElement && partAround(element.parentElement, "group"))
      )
    },
    separator: (controller, element) =>
      controller.separator(() => element.hasAttribute("kui-always-render")),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-command": ElementOf<
      typeof tag,
      { "input-value-change": ["onInputValueChange", "inputValue"]; select: ["onSelect", "value"] }
    >
  }
}
