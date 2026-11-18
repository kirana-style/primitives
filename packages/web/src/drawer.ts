import { computed } from "@kirana-ui/core"
import { createDrawer } from "@kirana-ui/core/drawer"
import type { Drawer, DrawerProps, DrawerSnapPoint } from "@kirana-ui/core/drawer"

import { defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

/** A place to rest, as an attribute writes it: a share (`0.5`) or a length (`200px`). */
const point = (text: unknown): DrawerSnapPoint | undefined =>
  typeof text !== "string" || text === "" ? (text as undefined) : isNaN(+text) ? text : +text

type Props = Omit<DrawerProps, "snapPoints" | "snapPoint" | "defaultSnapPoint"> & {
  snapPoints?: string | readonly DrawerSnapPoint[]
  snapPoint?: DrawerSnapPoint
  defaultSnapPoint?: DrawerSnapPoint
}

/**
 * `<kui-drawer>`: a dialog that comes from an edge and is dragged back to it, with the
 * dialog's parts. `open`, `default-open`, `modal`, `dismissible`, `swipe-direction`,
 * `snap-points` (with commas between: `0.4,1` or `200px,1`), `snap-point`,
 * `default-snap-point`; it tells `open-change` and `snap-point-change`.
 */
export const tag = defineElement<Props, Drawer>({
  tag: "kui-drawer",
  props: {
    open: "boolean",
    "default-open": "boolean",
    modal: "boolean",
    dismissible: "boolean",
    "swipe-direction": "string",
    "snap-points": "string",
    "snap-point": "string",
    "default-snap-point": "string",
  },
  create: (props) =>
    createDrawer(
      computed(() => {
        const own = props.get()
        const points = own.snapPoints
        return {
          ...own,
          snapPoints:
            typeof points === "string" ? points.split(",").map((each) => point(each)!) : points,
          snapPoint: point(own.snapPoint),
          defaultSnapPoint: point(own.defaultSnapPoint),
        }
      })
    ),
  changes: {
    onOpenChange: { event: "open-change", prop: "open" },
    onSnapPointChange: { event: "snap-point-change", prop: "snapPoint" },
  },
  parts: {
    trigger: (controller) => controller.trigger,
    backdrop: (controller) => ({ mounted: controller.mounted, part: controller.backdrop }),
    popup: (controller) => ({ mounted: controller.mounted, part: controller.popup }),
    title: (controller) => controller.title,
    description: (controller) => controller.description,
    close: (controller) => controller.close,
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-drawer": ElementOf<
      typeof tag,
      {
        "open-change": ["onOpenChange", "open"]
        "snap-point-change": ["onSnapPointChange", "snapPoint"]
      }
    >
  }
}
