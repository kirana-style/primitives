import { computed } from "@kirana-ui/core"
import { createProgress } from "@kirana-ui/core/progress"

import { defineElement } from "./runtime.ts"

/**
 * `<kui-progress>` around `kui-part="root"`, a `label`, a `track` with its `indicator`, and a
 * `value`, which says the value as it is written unless the page gave it something to say.
 * `value` (left out: not known yet), `min`, `max`, `locale`; `format` and `getAriaValueText` as properties.
 */
export const tag = defineElement({
  tag: "kui-progress",
  props: { value: "number", min: "number", max: "number", locale: "string" },
  properties: ["format", "getAriaValueText"],
  create: (props) =>
    createProgress(
      computed(() => {
        const own = props.get() as { id: string; value?: number | null }
        return { ...own, value: own.value ?? null }
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
