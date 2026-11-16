import { computed } from "@kirana-ui/core"
import { createNavigationMenu } from "@kirana-ui/core/navigation-menu"
import type {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuProps,
} from "@kirana-ui/core/navigation-menu"

import { once, place, valueOf } from "./around.ts"
import { defineElement, partAround } from "./runtime.ts"

const NOTHING = computed(() => ({}))
const items = new WeakMap<HTMLElement, NavigationMenuItem>()
const itemOf = (controller: NavigationMenu<string>, element: HTMLElement) =>
  once(items, partAround(element, "item"), (item) => controller.item(valueOf(item)))

/**
 * `<kui-navigation-menu>` around a `kui-part="root"` nav with its `list`. An `item` with a
 * `kui-value` has a `trigger` (with an `icon` if it has one) and a `content`, which is drawn
 * in the menu's one `viewport` while its item is open; a `link` is a link (`kui-active`,
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
    // An item with no value holds a link: it is the page's own element, and no part.
    item(controller, element) {
      if (!element.hasAttribute("kui-value")) return undefined
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
    positioner(controller, element) {
      place(controller.positioning, element)
      return { mounted: controller.mounted, part: controller.positioner }
    },
    popup: (controller) => controller.popup,
    viewport: (controller) => controller.viewport,
    arrow: (controller) => controller.arrow,
    backdrop: (controller) => ({ mounted: controller.mounted, part: controller.backdrop }),
  },
})
