import { signal } from "@kirana-ui/core"
import { createNumberField } from "@kirana-ui/core/number-field"
import type { NumberFieldProps } from "@kirana-ui/core/number-field"

import { fieldAround } from "./around.ts"
import { defineElement } from "./runtime.ts"
import type { As, ElementOf } from "./runtime.ts"

const number = (text: string | null) => (text === null ? undefined : Number(text))

/**
 * `<kui-number-field>` around `kui-part="root"`, a `group`, an `input`, and `increment` and
 * `decrement` buttons. With a name, the root draws the hidden input a form reads. A
 * `scrub-area` (a label, as a rule) is pressed and dragged to change the number, with
 * `kui-direction="vertical"`, `kui-pixel-sensitivity` and `kui-teleport-distance` on it; a
 * `scrub-area-cursor` inside it is drawn at the end of the page while the pointer is locked.
 * `value`, `default-value`, `min`, `max`, `step`, `small-step`, `large-step`, `snap-on-step`,
 * `allow-wheel-scrub`, `locale`, `disabled`, `read-only`, `required`, `name`, `form`; `format`
 * as a property; it tells `value-change` and `value-committed`.
 */
export const tag = defineElement({
  tag: "kui-number-field",
  props: {
    value: "number",
    "default-value": "number",
    min: "number",
    max: "number",
    step: "number",
    "small-step": "number",
    "large-step": "number",
    "snap-on-step": "boolean",
    "allow-wheel-scrub": "boolean",
    locale: "string",
    disabled: "boolean",
    "read-only": "boolean",
    required: "boolean",
    name: "string",
    form: "string",
  },
  properties: ["format"],
  create: (props, host) => createNumberField(props, { field: fieldAround(host) }),
  changes: {
    onValueChange: { event: "value-change", prop: "value" },
    onValueCommitted: { event: "value-committed", prop: "value", hold: false },
  },
  parts: {
    root: (controller) =>
      controller.named.peek()
        ? { part: controller.root, inner: controller.hidden }
        : controller.root,
    group: (controller) => controller.group,
    input: (controller) => controller.input,
    increment: (controller) => controller.increment,
    decrement: (controller) => controller.decrement,
    "scrub-area"(controller, element) {
      const direction = element.getAttribute("kui-direction")
      const pixelSensitivity = number(element.getAttribute("kui-pixel-sensitivity"))
      const teleportDistance = number(element.getAttribute("kui-teleport-distance"))
      controller.scrub.set({
        ...(direction === "vertical" || direction === "horizontal" ? { direction } : {}),
        ...(pixelSensitivity === undefined ? {} : { pixelSensitivity }),
        ...(teleportDistance === undefined ? {} : { teleportDistance }),
      })
      return controller.scrubArea
    },
    // Not where it was written: at the end of the page, over everything.
    "scrub-area-cursor": (controller, element) => ({
      ...controller.scrubAreaCursor,
      into: signal(element.ownerDocument.body),
    }),
  },
})

declare global {
  interface HTMLElementTagNameMap {
    "kui-number-field": ElementOf<
      As<typeof tag, NumberFieldProps>,
      {
        "value-change": ["onValueChange", "value"]
        "value-committed": ["onValueCommitted", "value"]
      }
    >
  }
}
