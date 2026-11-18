import { computed } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"

import { once, ownValue, positioner } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

const NOTHING = computed(() => ({}))
const items = new WeakMap<HTMLElement, NavigationMenuItem>()
const itemOf = (controller: NavigationMenu<string>, element: HTMLElement) =>
  once(items, partAround(element, "item"), (item) =>
    controller.item(item.getAttribute("kui-value") ?? ownValue(item))
  )

/**
 * `<kui-navigation-menu>` around a `kui-part="root"` nav with its `list`. An `item` has a
 * `trigger` (with an `icon` if it has one) and a `content`, which is drawn in the menu's one
 * `viewport` while its item is open; its `kui-value` tells it from the others, and an item
 * that is given none makes its own. A `link` is a link (`kui-active`,
 * `kui-close-on-click="false"`). The viewport is in a `portal` with a `positioner` around
 * the `popup`, with an `arrow` and a `backdrop` if it has them. `value`, `default-value`,
 * `delay`, `close-delay`, `orientation`; it tells `value-change`.
 */
export const tag = defineElement<NavigationMenuProps<string>, NavigationMenu<string>>({
  tag: "kui-navigation-menu",
  props: {
    value: "string",
    "default-value": "string",
    delay: "number",
    "close-delay": "number",
    orientation: "string",
  },
  create: (props) => createNavigationMenu<string>(props),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: {
    root: (controller) => controller.root,
    list: (controller) => controller.list,
    // The item's own element takes nothing: it is where the item is in the page.
    item(controller, element) {
      const item = itemOf(controller, element)!
      return { part: { props: NOTHING, attach: () => () => {} }, mount: () => item.mount() }
    },
    trigger: (controller, element) => itemOf(controller, element)?.trigger,
    icon: (controller, element) => itemOf(controller, element)?.icon,
    content(controller, element) {
      const item = itemOf(controller, element)
      return item && { part: item.content, mounted: item.mounted, into: controller.viewportElement }
    },
    link: (controller, element) =>
      controller.link(() => ({
        ...(element.hasAttribute("kui-active") ? { active: true } : {}),
        ...(element.hasAttribute("kui-close-on-click")
          ? { closeOnClick: element.getAttribute("kui-close-on-click") !== "false" }
          : {}),
      })),
    positioner,
    popup: (controller) => controller.popup,
    viewport: (controller) => controller.viewport,
    arrow: (controller) => controller.arrow,
    backdrop: (controller) => ({ mounted: controller.mounted, part: controller.backdrop }),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-navigation-menu": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
