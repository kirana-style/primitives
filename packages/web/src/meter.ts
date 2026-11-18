import { computed } from "@kirana-ui/core"
import { createMeter } from "@kirana-ui/core/meter"
import type { MeterProps } from "@kirana-ui/core/meter"

import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

/**
 * `<kui-meter>` around `kui-part="root"`, a `label`, a `track` with its `indicator`, and a
 * `value`, which says the value as it is written unless the page gave it something to say.
 * `value`, `min`, `max`, `locale`; `format` and `getAriaValueText` as properties.
 */
export const tag = defineElement({
  tag: "kui-meter",
  props: { value: "number", min: "number", max: "number", locale: "string" },
  properties: ["format", "getAriaValueText"],
  create: (props) =>
    createMeter(
      computed(() => {
        const own = props.get() as { id: string; value?: number | null }
        return { ...own, value: own.value ?? 0 }
      }) as never
    ),
  changes: {},
  parts: {
    root: (controller) => controller.root,
    label: (controller) => controller.label,
    track: (controller) => controller.track,
    indicator: (controller) => controller.indicator,
    value: (controller) => ({ part: controller.value, text: controller.text }),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-meter": ElementOf<As<typeof tag, MeterProps>>
  }
}
