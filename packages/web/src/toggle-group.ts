import { computed } from "@kirana-ui/core"
import { createToggleGroup } from "@kirana-ui/core/toggle-group"
import type { ToggleGroup, ToggleGroupProps } from "@kirana-ui/core/toggle-group"

import { list } from "./around.ts"
import { controllerAround, defineElement } from "./runtime.ts"
import type { ElementOf } from "./runtime.ts"

type Props = Omit<ToggleGroupProps<string>, "value" | "defaultValue"> & {
  id: string
  value?: string | readonly string[]
  defaultValue?: string | readonly string[]
}

/**
 * `<kui-toggle-group>` around `kui-part="root"` and its `<kui-toggle>`s, each with a `value`.
 * `value` and `default-value` (the pressed ones, with commas between), `multiple`, `disabled`,
 * `orientation`, `loop-focus` (`loop` is its older name); it tells `value-change`.
 */
export const tag = defineElement<Props, ToggleGroup<string>>({
  tag: "kui-toggle-group",
  props: {
    value: "string",
    "default-value": "string",
    multiple: "boolean",
    disabled: "boolean",
    orientation: "string",
    "loop-focus": "boolean",
    loop: "boolean",
  },
  create: (props, host) =>
    createToggleGroup<string>(
      computed(() => {
        const own = props.get()
        return { ...own, value: list(own.value), defaultValue: list(own.defaultValue) }
      }),
      { toolbar: controllerAround(host, "kui-toolbar") }
    ),
  changes: { onValueChange: { event: "value-change", prop: "value" } },
  parts: { root: (controller) => controller.root },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-toggle-group": ElementOf<typeof tag, { "value-change": ["onValueChange", "value"] }>
  }
}
